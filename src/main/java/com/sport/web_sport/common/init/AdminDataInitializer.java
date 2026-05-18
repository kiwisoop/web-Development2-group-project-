package com.sport.web_sport.common.init;

import com.sport.web_sport.user.entity.User;
import com.sport.web_sport.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class AdminDataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        userRepository.findByUsername("admin").ifPresentOrElse(
            admin -> {
                if (!"ADMIN".equals(admin.getRole())) {
                    admin.setRole("ADMIN");
                }
            },
            () -> userRepository.save(User.builder()
                    .username("admin")
                    .password("admin123")
                    .nickname("관리자")
                    .role("ADMIN")
                    .createdAt(LocalDateTime.now())
                    .build())
        );
    }
}
