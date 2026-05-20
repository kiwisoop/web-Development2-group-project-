package com.sport.web_sport.user.controller;

import com.sport.web_sport.common.response.ApiResponse;
import com.sport.web_sport.user.dto.LoginRequest;
import com.sport.web_sport.user.dto.MeResponse;
import com.sport.web_sport.user.dto.RegisterRequest;
import com.sport.web_sport.user.dto.UserResponse;
import com.sport.web_sport.user.entity.User;
import com.sport.web_sport.user.repository.UserRepository;
import com.sport.web_sport.user.service.AuthService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class RestAuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("회원가입이 완료되었습니다.", UserResponse.from(user)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpSession session) {
        User user = authService.login(request, session);
        return ResponseEntity.ok(ApiResponse.ok("로그인이 완료되었습니다.", UserResponse.from(user)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpSession session) {
        authService.logout(session);
        return ResponseEntity.ok(ApiResponse.ok("로그아웃이 완료되었습니다.", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<MeResponse>> me(HttpSession session) {
        Long userId = authService.getLoginUserId(session);
        if (userId == null) {
            return ResponseEntity.ok(ApiResponse.ok(MeResponse.anonymous()));
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            session.invalidate();
            return ResponseEntity.ok(ApiResponse.ok(MeResponse.anonymous()));
        }
        return ResponseEntity.ok(ApiResponse.ok(MeResponse.of(user)));
    }
}
