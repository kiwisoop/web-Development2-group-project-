package com.sport.web_sport.user.dto;

import com.sport.web_sport.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class MeResponse {
    private boolean loggedIn;
    private Long userId;
    private String username;
    private String nickname;
    private String role;

    public static MeResponse of(User user) {
        return MeResponse.builder()
                .loggedIn(true)
                .userId(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .role(user.getRole())
                .build();
    }

    public static MeResponse anonymous() {
        return MeResponse.builder()
                .loggedIn(false)
                .build();
    }
}
