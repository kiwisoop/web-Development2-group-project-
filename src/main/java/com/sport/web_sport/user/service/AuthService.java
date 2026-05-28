package com.sport.web_sport.user.service;

import com.sport.web_sport.common.error.BusinessException;
import com.sport.web_sport.user.dto.LoginRequest;
import com.sport.web_sport.user.dto.RegisterRequest;
import com.sport.web_sport.user.entity.User;
import com.sport.web_sport.user.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    public static final String SESSION_USER_ID = "LOGIN_USER_ID";
    public static final String SESSION_USERNAME = "LOGIN_USERNAME";

    private static final BCryptPasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();

    private final UserRepository userRepository;

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("이미 사용 중인 아이디입니다.");
        }
        User user = User.builder()
                .username(request.getUsername())
                .password(PASSWORD_ENCODER.encode(request.getPassword()))
                .nickname(request.getNickname())
                .createdAt(LocalDateTime.now())
                .build();
        return userRepository.save(user);
    }

    @Transactional
    public User login(LoginRequest request, HttpSession session) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException("아이디 또는 비밀번호가 올바르지 않습니다."));
        if (!isPasswordValid(request.getPassword(), user)) {
            throw new BusinessException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }
        session.setAttribute(SESSION_USER_ID, user.getId());
        session.setAttribute(SESSION_USERNAME, user.getUsername());
        return user;
    }

    public void logout(HttpSession session) {
        session.invalidate();
    }

    public Long getLoginUserId(HttpSession session) {
        Object id = session.getAttribute(SESSION_USER_ID);
        return id == null ? null : (Long) id;
    }

    public Long requireLoginUserId(HttpSession session) {
        Long id = getLoginUserId(session);
        if (id == null) {
            throw new BusinessException("로그인이 필요합니다.");
        }
        return id;
    }

    public void requireAdmin(HttpSession session) {
        Long userId = requireLoginUserId(session);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("로그인이 필요합니다."));
        if (!"ADMIN".equals(user.getRole())) {
            throw new BusinessException("관리자 권한이 필요합니다.");
        }
    }

    private boolean isPasswordValid(String rawPassword, User user) {
        String savedPassword = user.getPassword();
        if (savedPassword == null) {
            return false;
        }
        if (savedPassword.startsWith("$2")) {
            return PASSWORD_ENCODER.matches(rawPassword, savedPassword);
        }
        if (savedPassword.equals(rawPassword)) {
            user.setPassword(PASSWORD_ENCODER.encode(rawPassword));
            return true;
        }
        return false;
    }
}
