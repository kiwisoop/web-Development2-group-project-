package com.sport.web_sport.admin.controller;

import com.sport.web_sport.admin.dto.AdminDashboardResponse;
import com.sport.web_sport.admin.service.AdminDashboardService;
import com.sport.web_sport.common.response.ApiResponse;
import com.sport.web_sport.user.service.AuthService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;
    private final AuthService authService;

    @GetMapping("/dashboard")
    public ApiResponse<AdminDashboardResponse> getDashboard(HttpSession session) {
        authService.requireAdmin(session);
        return ApiResponse.ok(adminDashboardService.buildDashboard());
    }
}
