package com.team.sportsanalysis.user;

import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// Simple register/login. No Spring Security yet (per spec).
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository repo;

    public AuthController(UserRepository repo) {
        this.repo = repo;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (repo.existsByUsername(req.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "username already exists"));
        }
        User saved = repo.save(User.builder()
                .username(req.getUsername())
                .password(req.getPassword())
                .email(req.getEmail())
                .nickname(req.getNickname())
                .build());
        saved.setPassword(null);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        return repo.findByUsername(req.getUsername())
                .filter(u -> u.getPassword().equals(req.getPassword()))
                .<ResponseEntity<?>>map(u -> {
                    u.setPassword(null);
                    return ResponseEntity.ok(u);
                })
                .orElseGet(() -> ResponseEntity.status(401).body(Map.of("error", "invalid credentials")));
    }

    @Data public static class RegisterRequest {
        private String username; private String password; private String email; private String nickname;
    }
    @Data public static class LoginRequest {
        private String username; private String password;
    }
}
