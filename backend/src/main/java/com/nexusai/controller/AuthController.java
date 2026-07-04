package com.nexusai.controller;

import com.nexusai.model.User;
import com.nexusai.repository.UserRepository;
import com.nexusai.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    public static class LoginRequest {
        private String name;
        private String email;
        private String password;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class GuestRequest {
        private String userId;

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        if (req.getEmail() == null || req.getEmail().trim().isEmpty() ||
            req.getPassword() == null || req.getPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password required"));
        }

        try {
            String email = req.getEmail().trim();
            String password = req.getPassword();
            
            Optional<User> existingUser = userRepository.findByEmail(email);
            User user;
            if (existingUser.isPresent()) {
                user = existingUser.get();
                if (!user.getPassword().equals(password)) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Incorrect password"));
                }
            } else {
                user = new User();
                user.setUserId(UUID.randomUUID().toString());
                String name = req.getName();
                if (name == null || name.trim().isEmpty()) {
                    name = email.split("@")[0];
                }
                user.setName(name);
                user.setEmail(email);
                user.setPassword(password);
                user = userRepository.save(user);
            }

            String token = jwtUtil.generateToken(user.getUserId(), user.getName(), "user");
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "userId", user.getUserId(),
                    "name", user.getName()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Authentication failed"));
        }
    }

    @PostMapping("/guest")
    public ResponseEntity<?> guest(@RequestBody(required = false) GuestRequest req) {
        String userId = (req != null && req.getUserId() != null && !req.getUserId().trim().isEmpty())
                ? req.getUserId().trim()
                : UUID.randomUUID().toString();

        String token = jwtUtil.generateToken(userId, null, "guest");
        return ResponseEntity.ok(Map.of(
                "token", token,
                "userId", userId,
                "expiresIn", "7d"
        ));
    }
}
