package com.lunfit.authservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {
    private String secret;
    private Long accessTokenExpiry;  // in milliseconds
    private Long refreshTokenExpiry; // in milliseconds
}
