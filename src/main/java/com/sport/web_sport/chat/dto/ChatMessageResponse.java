package com.sport.web_sport.chat.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatMessageResponse {
    private Long id;
    private Long roomId;
    private Long userId;
    private String username;
    private String nickname;
    private String content;
    private LocalDateTime createdAt;
}
