package com.sport.web_sport.admin.controller;

import com.sport.web_sport.admin.dto.AdminDashboardResponse;
import com.sport.web_sport.admin.dto.SyncRequest;
import com.sport.web_sport.admin.dto.SyncResultResponse;
import com.sport.web_sport.admin.service.AdminDashboardService;
import com.sport.web_sport.common.response.ApiResponse;
import com.sport.web_sport.esports.service.EsportsSyncService;
import com.sport.web_sport.soccer.service.SoccerSyncService;
import com.sport.web_sport.user.service.AuthService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;
    private final SoccerSyncService soccerSyncService;
    private final EsportsSyncService esportsSyncService;
    private final AuthService authService;

    @GetMapping("/dashboard")
    public ApiResponse<AdminDashboardResponse> getDashboard(HttpSession session) {
        authService.requireAdmin(session);
        return ApiResponse.ok(adminDashboardService.buildDashboard());
    }

    @PostMapping("/soccer/sync/fixtures")
    public ApiResponse<SyncResultResponse> syncSoccerFixtures(
            @Valid @RequestBody SyncRequest request,
            HttpSession session) {
        authService.requireAdmin(session);
        return ApiResponse.ok(soccerSyncService.sync(request.getStartDate(), request.getEndDate()));
    }

    @PostMapping("/esports/sync/schedule")
    public ApiResponse<SyncResultResponse> syncEsportsSchedule(
            @Valid @RequestBody SyncRequest request,
            HttpSession session) {
        authService.requireAdmin(session);
        return ApiResponse.ok(esportsSyncService.sync(request.getStartDate(), request.getEndDate()));
    }
}
