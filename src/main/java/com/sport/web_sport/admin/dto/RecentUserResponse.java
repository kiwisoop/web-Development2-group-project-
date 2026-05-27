package com.sport.web_sport.admin.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RecentUserResponse {
    private Long userId;
    private String username;
    private String nickname;
    private LocalDateTime createdAt;
}
