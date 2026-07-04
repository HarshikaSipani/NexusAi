package com.nexusai.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    private final SecretKey key;

    public JwtUtil(@Value("${JWT_SECRET:supersecretkey123}") String secret) {
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            byte[] paddedBytes = new byte[32];
            System.arraycopy(secretBytes, 0, paddedBytes, 0, secretBytes.length);
            secretBytes = paddedBytes;
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
    }

    public String generateToken(String userId, String name, String type) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        if (name != null) {
            claims.put("name", name);
        }
        claims.put("type", type);

        return Jwts.builder()
                .claims(claims)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 7L * 24 * 60 * 60 * 1000)) // 7 days
                .signWith(key)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
