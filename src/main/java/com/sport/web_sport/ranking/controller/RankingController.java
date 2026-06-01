package com.sport.web_sport.ranking.controller;

import com.sport.web_sport.common.response.ApiResponse;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.ranking.dto.RankingTeamResponse;
import com.sport.web_sport.ranking.service.RankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rankings")
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;

    @GetMapping("/{sportType}")
    public ApiResponse<List<RankingTeamResponse>> getRankings(
            @PathVariable SportType sportType,
            @RequestParam(required = false) String season) {
        return ApiResponse.ok(rankingService.getRankings(sportType, season));
    }
}
