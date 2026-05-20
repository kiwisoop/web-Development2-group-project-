package com.sport.web_sport.chat.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatRoomResponse {
    private Long roomId;
    private String roomType;
    private String sportType;
    private Long matchId;
    private String name;
}
