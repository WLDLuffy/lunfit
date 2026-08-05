# Story 1.2: JWT Security Filter Chain

Status: ready-for-dev

## Story

As a developer,
I want all API endpoints protected by a JWT authentication filter that validates tokens and extracts the userId,
so that unauthenticated requests are rejected before reaching any business logic.

## Acceptance Criteria

1. **Given** a request to any `/api/v1/**` endpoint with no `Authorization` header — **When** the request is processed — **Then** the response is `401 Unauthorized` with the standard `ErrorResponse` body

2. **Given** a request with an `Authorization: Bearer {token}` where the token is expired or has an invalid signature against `JWT_SECRET` — **When** the request is processed — **Then** the response is `401 Unauthorized`

3. **Given** a request with a valid JWT signed with `JWT_SECRET` — **When** the JWT filter processes it — **Then** an `AuthenticatedUser` principal is placed in the Spring SecurityContext containing `userId` (UUID) and `email` — **And** the request proceeds to the controller

4. **Given** the security configuration — **When** compiled — **Then** session management is `STATELESS`, CSRF is disabled, and all `/api/v1/**` paths require authentication — **And** `/swagger-ui.html`, `/swagger-ui/**`, `/v3/api-docs/**`, and `/actuator/health` are publicly accessible

## Tasks / Subtasks

- [ ] Task 1: Create ErrorResponse DTO (AC: 1)
  - [ ] `exception/ErrorResponse.java` with fields: `timestamp` (LocalDateTime), `status` (int), `error` (String), `message` (String), `path` (String), `errors` (List of field error)
  - [ ] `@JsonInclude(NON_NULL)` on the class — `errors` must be omitted for 401/403/404
  - [ ] `@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")` on `timestamp` — NO `Z` suffix, matches auth-service contract

- [ ] Task 2: Create AuthenticatedUser principal record (AC: 3)
  - [ ] `security/AuthenticatedUser.java` — Java `record` with `UUID userId` and `String email`

- [ ] Task 3: Create JwtTokenValidator (AC: 2, 3)
  - [ ] `security/JwtTokenValidator.java` — `@Component`, injects `${jwt.secret}`
  - [ ] Parses and validates token using jjwt 0.12.5 API
  - [ ] Returns `AuthenticatedUser` on success; throws `JwtException` on failure (expired, bad signature, malformed)
  - [ ] Extracts `userId` from `userId` custom claim (Long), converts to UUID: `new UUID(0L, userId)`
  - [ ] Extracts `email` from JWT `sub` claim

- [ ] Task 4: Create JwtAuthenticationFilter (AC: 1, 2, 3)
  - [ ] `security/JwtAuthenticationFilter.java` — extends `OncePerRequestFilter`, annotated `@Component`
  - [ ] Reads `Authorization` header; passes through if no `Bearer ` prefix (let Spring Security handle)
  - [ ] Calls `JwtTokenValidator.validate(token)` — on success sets `UsernamePasswordAuthenticationToken` in `SecurityContextHolder`
  - [ ] On `JwtException`: clears context, does NOT write the response — lets `JwtAuthenticationEntryPoint` handle the 401

- [ ] Task 5: Create JwtAuthenticationEntryPoint (AC: 1)
  - [ ] `security/JwtAuthenticationEntryPoint.java` — implements `AuthenticationEntryPoint`, annotated `@Component`
  - [ ] Writes `401 Unauthorized` response body as `ErrorResponse` JSON
  - [ ] Sets `Content-Type: application/json`

- [ ] Task 6: Replace SecurityConfig with JWT filter chain (AC: 1, 2, 3, 4)
  - [ ] OVERWRITE `security/SecurityConfig.java` — replace Story 1.1 temporary permit-all
  - [ ] STATELESS session, CSRF disabled, `/api/v1/**` requires authentication
  - [ ] Permit: `/swagger-ui.html`, `/swagger-ui/**`, `/v3/api-docs/**`, `/actuator/health`
  - [ ] Inject and register `JwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter`
  - [ ] Register `JwtAuthenticationEntryPoint` as `exceptionHandling` entry point

- [ ] Task 7: Write security integration tests (AC: 1, 2, 3, 4)
  - [ ] Create `integration/SecurityFilterIntegrationTest.java`
  - [ ] `@SpringBootTest(webEnvironment = RANDOM_PORT)` + `@Testcontainers` + `@AutoConfigureMockMvc`
  - [ ] `@ServiceConnection` on `PostgreSQLContainer<>("postgres:16-alpine")`
  - [ ] Test: no auth header → 401 with `ErrorResponse` body on `/api/v1/workouts`
  - [ ] Test: garbage token → 401
  - [ ] Test: expired token (construct manually) → 401
  - [ ] Test: valid signed token → not 401 (404 is OK — no controller yet)
  - [ ] Test: `/actuator/health` without token → 200 (public endpoint)
  - [ ] Run `./mvnw test` — all tests must pass including Story 1.1 tests

## Dev Notes

### CRITICAL: JWT Claim Structure — auth-service differs from architecture doc

The architecture doc says `sub` = userId. **This is wrong.** The actual auth-service (`JwtService.java`) encodes tokens as:

```java
claims.put("userId", user.getId());   // Long (auto-increment DB ID, e.g. 1, 2, 3)
claims.put("email", user.getEmail()); // String
.subject(user.getEmail())             // sub = email, NOT userId
```

So the real JWT structure is:
- `sub` = user email (String)
- `userId` = user database ID (**Long**, not UUID)
- `email` = user email (String, same as sub)

**Extraction in JwtTokenValidator:**

```java
Claims claims = Jwts.parser()
    .verifyWith(getSigningKey())
    .build()
    .parseSignedClaims(token)
    .getPayload();

Long userIdLong = claims.get("userId", Long.class);   // NOT from sub
String email = claims.getSubject();                    // sub = email
```

### CRITICAL: userId Type Conversion (Long from JWT → UUID in schema)

The `workouts.user_id` column is `UUID` (V1 migration — do NOT change). The JWT carries `userId` as a `Long`. Bridge them with a **deterministic conversion**:

```java
UUID userId = new UUID(0L, userIdLong);
// user ID 1  → 00000000-0000-0000-0000-000000000001
// user ID 42 → 00000000-0000-0000-0000-00000000002a
```

Use this exact conversion in `JwtTokenValidator`. This is stable and reversible. **Do NOT** use `UUID.randomUUID()` or `UUID.nameUUIDFromBytes()` — only `new UUID(0L, userIdLong)`.

### jjwt 0.12.5 API (same version as auth-service — do NOT use deprecated API)

```java
// Parsing — throws JwtException subtypes on all failure modes
Claims claims = Jwts.parser()
    .verifyWith(getSigningKey())
    .build()
    .parseSignedClaims(token)
    .getPayload();

// Key derivation — same as auth-service
private SecretKey getSigningKey() {
    byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
    return Keys.hmacShaKeyFor(keyBytes);
}
```

`parseSignedClaims()` throws:
- `ExpiredJwtException` (extends `JwtException`) — token past expiry
- `SignatureException` (extends `SecurityException` extends `JwtException`) — wrong secret
- `MalformedJwtException` (extends `JwtException`) — garbled token

Catch `io.jsonwebtoken.JwtException` (base) — treat all subtypes as 401.

### Files to Create

| File | Package | Description |
|---|---|---|
| `ErrorResponse.java` | `exception` | Error response DTO — shared with Story 1.3 GlobalExceptionHandler |
| `FieldError.java` | `exception` | Nested field error — `{ "field": "...", "message": "..." }` |
| `AuthenticatedUser.java` | `security` | Principal record: `UUID userId, String email` |
| `JwtTokenValidator.java` | `security` | JWT parsing + claim extraction + UUID conversion |
| `JwtAuthenticationFilter.java` | `security` | OncePerRequestFilter — sets SecurityContext |
| `JwtAuthenticationEntryPoint.java` | `security` | Returns 401 ErrorResponse JSON |
| `SecurityFilterIntegrationTest.java` | `integration` (test) | Full-stack JWT filter tests |

### Files to MODIFY

| File | Change |
|---|---|
| `security/SecurityConfig.java` | **REPLACE** entire file — remove Story 1.1 temp permit-all, add full JWT filter chain |

### ErrorResponse DTO

Must match auth-service `ErrorResponse` contract **exactly** (timestamp as `LocalDateTime` without `Z`):

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;
    private String path;
    private List<FieldError> errors;   // null for 401/403/404/409 — omitted by @JsonInclude(NON_NULL)
}
```

Separate `FieldError` record (or inner class):
```java
public record FieldError(String field, String message) {}
```

### JwtAuthenticationEntryPoint Pattern

```java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ErrorResponse body = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(401)
            .error("UNAUTHORIZED")
            .message("Authentication required")
            .path(request.getRequestURI())
            .build();

        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
```

### JwtAuthenticationFilter Pattern

```java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenValidator tokenValidator;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // No token — pass through; Spring Security will invoke entryPoint for /api/v1/** paths
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        try {
            AuthenticatedUser user = tokenValidator.validate(token);
            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(user, null, List.of());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (JwtException e) {
            // Invalid/expired token — clear context, entryPoint will return 401
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
```

### SecurityConfig Pattern (replaces Story 1.1 temp version)

```java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/swagger-ui.html",
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/actuator/health"
                ).permitAll()
                .requestMatchers("/api/v1/**").authenticated()
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

### Integration Test Pattern

Generate test JWTs using the same jjwt 0.12.5 API and a fixed test secret:

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class SecurityFilterIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    MockMvc mockMvc;

    @Value("${jwt.secret}")
    String jwtSecret;

    private String generateValidToken(long userId, String email) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
            .claim("userId", userId)
            .claim("email", email)
            .subject(email)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + 3_600_000))
            .signWith(key)
            .compact();
    }

    @Test
    void noAuthHeader_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/workouts"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    void invalidToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/workouts")
            .header("Authorization", "Bearer not.a.valid.token"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void expiredToken_returns401() throws Exception {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        String expired = Jwts.builder()
            .claim("userId", 1L)
            .subject("test@example.com")
            .issuedAt(new Date(System.currentTimeMillis() - 7_200_000))
            .expiration(new Date(System.currentTimeMillis() - 3_600_000))
            .signWith(key)
            .compact();

        mockMvc.perform(get("/api/v1/workouts")
            .header("Authorization", "Bearer " + expired))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void validToken_passesFilter_returns404BecauseNoController() throws Exception {
        // No WorkoutController yet in this story — 404 means filter passed, not 401
        mockMvc.perform(get("/api/v1/workouts")
            .header("Authorization", "Bearer " + generateValidToken(1L, "user@example.com")))
            .andExpect(status().isNotFound());
    }

    @Test
    void actuatorHealth_publicEndpoint_returns200WithoutToken() throws Exception {
        mockMvc.perform(get("/actuator/health"))
            .andExpect(status().isOk());
    }
}
```

**IMPORTANT:** Add a test `jwt.secret` in `application.yml` or provide it as `@TestPropertySource`. The default `${JWT_SECRET:}` empty string will cause jjwt key derivation to fail if the key is too short. For tests, set `jwt.secret` to a fixed 32+ character string via `@TestPropertySource(properties = "jwt.secret=test-secret-minimum-256-bits-long!")`.

### application.yml — No Changes Needed

The existing `jwt.secret: ${JWT_SECRET:}` default is fine. The empty default means the app starts without JWT_SECRET set, but the filter will fail to build the signing key. For real deployment, always set `JWT_SECRET` env var (32+ chars). For tests, override via `@TestPropertySource`.

### Lombok Usage Reminder

- `SecurityConfig`, `JwtAuthenticationFilter`, `JwtTokenValidator`: use `@RequiredArgsConstructor` for constructor injection
- `ErrorResponse`: use `@Data @Builder @NoArgsConstructor @AllArgsConstructor`
- `AuthenticatedUser`: use Java `record` — no Lombok needed

### What NOT to Implement in Story 1.2

- `GlobalExceptionHandler` — Story 1.3 (ErrorResponse DTO is shared, but the handler is Story 1.3)
- Swagger `@Operation` / `@ApiResponse` annotations — Story 1.3
- `WorkoutEventPublisher` interface — Story 1.4
- `Dockerfile` / `docker-compose.yml` — Story 1.4
- `WorkoutController` — Story 2.1 (no business endpoints yet)
- Business logic, DTOs, mapper — Stories 2.x+

### Prior Story Learnings (from Story 1.1)

- `flyway-database-postgresql` does NOT exist at version 9.22.3 — do NOT add it
- `spring-boot-testcontainers` is already on the classpath — use `@ServiceConnection` in new tests
- Lombok `@Data @Builder @NoArgsConstructor @AllArgsConstructor` is the project pattern for classes; use Java `record` for value objects like `AuthenticatedUser`
- `BaseEntity` exists for `createdAt`/`updatedAt` — not relevant to this story
- `@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)` is required with Testcontainers

### References

- Auth-service JWT implementation: `auth-service/src/main/java/com/lunfit/authservice/service/JwtService.java`
- Architecture: Authentication & Security section — [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]
- Architecture: Naming conventions — [Source: `_bmad-output/planning-artifacts/architecture.md#Naming Patterns`]
- Architecture: Layer structure — [Source: `_bmad-output/planning-artifacts/architecture.md#Layer Package Organisation`]

## Dev Agent Record

### Agent Model Used

_to be filled by dev agent_

### Debug Log References

_to be filled by dev agent_

### Completion Notes List

_to be filled by dev agent_

### File List

_to be filled by dev agent_
