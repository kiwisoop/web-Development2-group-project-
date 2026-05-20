package com.sport.web_sport.recommend.controller;

import com.sport.web_sport.common.response.ApiResponse;
import com.sport.web_sport.recommend.dto.RecommendedTeamResponse;
import com.sport.web_sport.recommend.service.RecommendedTeamService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 로그인 사용자의 추천팀(맞춤 분석) 조회 API.
 *
 * GET /api/users/me/recommended-teams
 *   → ApiResponse&lt;List&lt;RecommendedTeamResponse&gt;&gt;
 *
 * 조회 전용. 추가/삭제(POST/DELETE)는 본 단계 범위 밖.
 */
@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class RecommendedTeamController {

    private final RecommendedTeamService recommendedTeamService;

    @GetMapping("/recommended-teams")
    public ApiResponse<List<RecommendedTeamResponse>> getRecommendedTeams(HttpSession session) {
        return ApiResponse.ok(recommendedTeamService.getRecommendedTeams(session));
    }
}
