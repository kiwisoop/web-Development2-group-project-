package com.sport.web_sport.soccer.controller;

import com.sport.web_sport.common.response.ApiResponse;
import com.sport.web_sport.soccer.dto.FixtureSearchCondition;
import com.sport.web_sport.soccer.dto.response.FixtureDetailResponse;
import com.sport.web_sport.soccer.dto.response.FixtureResponse;
import com.sport.web_sport.soccer.dto.response.SoccerTeamResponse;
import com.sport.web_sport.soccer.dto.response.StandingResponse;
import com.sport.web_sport.soccer.entity.Fixture;
import com.sport.web_sport.soccer.entity.SoccerTeam;
import com.sport.web_sport.soccer.service.FixtureService;
import com.sport.web_sport.soccer.service.SoccerTeamService;
import com.sport.web_sport.soccer.service.StandingService;
import com.sport.web_sport.sports.dto.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/soccer")
@RequiredArgsConstructor
public class SoccerController {

    private final FixtureService fixtureService;
    private final StandingService standingService;
    private final SoccerTeamService soccerTeamService;

    @GetMapping("/fixtures")
    public ApiResponse<PageResponse<FixtureResponse>> fixtures(
            @ModelAttribute FixtureSearchCondition condition) {
        Page<Fixture> page = fixtureService.search(condition);
        return ApiResponse.ok(PageResponse.of(page, FixtureResponse::from));
    }

    @GetMapping("/fixtures/{id}")
    public ApiResponse<FixtureDetailResponse> fixtureDetail(@PathVariable String id) {
        return ApiResponse.ok(FixtureDetailResponse.from(fixtureService.findById(id)));
    }

    @GetMapping("/standings")
    public ApiResponse<List<StandingResponse>> standings(
            @RequestParam(defaultValue = "2026") String season) {
        return ApiResponse.ok(standingService.getStandings(season));
    }

    @GetMapping("/teams")
    public ApiResponse<List<SoccerTeamResponse>> teams() {
        List<SoccerTeam> teams = soccerTeamService.findAll();
        return ApiResponse.ok(teams.stream().map(SoccerTeamResponse::summary).toList());
    }

    @GetMapping("/teams/{id}")
    public ApiResponse<SoccerTeamResponse> teamDetail(@PathVariable String id) {
        return ApiResponse.ok(SoccerTeamResponse.from(soccerTeamService.findById(id)));
    }
}
