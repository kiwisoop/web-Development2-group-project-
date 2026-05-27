package com.sport.web_sport.chat.controller;

import com.sport.web_sport.chat.dto.ChatMessageRequest;
import com.sport.web_sport.chat.dto.ChatMessageResponse;
import com.sport.web_sport.chat.service.ChatService;
import com.sport.web_sport.common.response.ApiResponse;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.user.service.AuthService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final AuthService authService;

    @GetMapping("/api/matches/{matchId}/chat")
    public ApiResponse<List<ChatMessageResponse>> getMatchChat(@PathVariable Long matchId) {
        return ApiResponse.ok(chatService.getMatchMessages(matchId));
    }

    @PostMapping("/api/matches/{matchId}/chat")
    public ApiResponse<ChatMessageResponse> sendMatchChat(
            @PathVariable Long matchId,
            @RequestBody ChatMessageRequest request,
            HttpSession session) {
        Long userId = authService.requireLoginUserId(session);
        return ApiResponse.ok(chatService.writeMatchMessage(matchId, userId, request.getContent()));
    }

    @GetMapping("/api/chat/sports/{sportType}")
    public ApiResponse<List<ChatMessageResponse>> getSportChat(@PathVariable SportType sportType) {
        return ApiResponse.ok(chatService.getSportMessages(sportType));
    }

    @PostMapping("/api/chat/sports/{sportType}")
    public ApiResponse<ChatMessageResponse> sendSportChat(
            @PathVariable SportType sportType,
            @RequestBody ChatMessageRequest request,
            HttpSession session) {
        Long userId = authService.requireLoginUserId(session);
        return ApiResponse.ok(chatService.writeSportMessage(sportType, userId, request.getContent()));
    }
}
