package com.sport.web_sport.baseball.controller;

import com.sport.web_sport.baseball.dto.MlbSyncRequest;
import com.sport.web_sport.baseball.dto.MlbSyncResultResponse;
import com.sport.web_sport.baseball.service.MlbSyncService;
import com.sport.web_sport.common.response.ApiResponse;
import com.sport.web_sport.user.service.AuthService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/mlb")
@RequiredArgsConstructor
public class MlbSyncController {

    private final MlbSyncService mlbSyncService;
    private final AuthService authService;

    @PostMapping("/sync/schedule")
    public ApiResponse<MlbSyncResultResponse> syncSchedule(
            @Valid @RequestBody MlbSyncRequest request,
            HttpSession session) {
        authService.requireAdmin(session);
        return ApiResponse.ok(mlbSyncService.sync(request));
    }
}
