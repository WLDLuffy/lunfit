# Build stage — dependencies are resolved in their own layer so that editing
# src/ doesn't re-download the world on every rebuild.
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

# Runtime stage — JRE only, no Maven, no source.
FROM eclipse-temurin:17-jre
WORKDIR /app

RUN groupadd --system spring && useradd --system --gid spring spring

COPY --from=build /build/target/*.jar app.jar
RUN chown spring:spring app.jar

USER spring
EXPOSE 8081

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
