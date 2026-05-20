package com.sport.web_sport.sports.controller;

import com.sport.web_sport.baseball.dto.response.MlbGameDetailResponse;
import com.sport.web_sport.baseball.dto.response.MlbPitchZoneResponse;
import com.sport.web_sport.baseball.dto.response.MlbPlayByPlayResponse;
import com.sport.web_sport.baseball.service.MlbGameDetailService;
import com.sport.web_sport.sports.dto.MatchSearchCondition;
import com.sport.web_sport.sports.dto.response.MatchDetailFullResponse;
import com.sport.web_sport.sports.dto.response.MatchEventResponse;
import com.sport.web_sport.sports.dto.response.MatchResponse;
import com.sport.web_sport.sports.dto.response.MatchStatResponse;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.dto.response.MatchSectionsResponse;
import com.sport.web_sport.sports.dto.response.PageResponse;
import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.sports.service.MatchService;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchApiController {

    private final MatchService matchService;
    private final MlbGameDetailService mlbGameDetailService;

    @GetMapping
    public PageResponse<MatchResponse> list(@ModelAttribute MatchSearchCondition condition) {
        Page<Match> page = matchService.searchMatchesPaged(condition);
        return PageResponse.of(page, MatchResponse::from);
    }

    @GetMapping("/{id}")
    public MatchResponse detail(@PathVariable Long id) {
        return MatchResponse.from(matchService.findMatchDetail(id));
    }

    @GetMapping("/{id}/stats")
    public List<MatchStatResponse> stats(@PathVariable Long id) {
        return matchService.findStatsByMatchId(id).stream()
                .map(MatchStatResponse::from)
                .toList();
    }

    @GetMapping("/{id}/events")
    public List<MatchEventResponse> events(@PathVariable Long id) {
        return matchService.findEventsByMatchId(id).stream()
                .map(MatchEventResponse::from)
                .toList();
    }

    @GetMapping("/{id}/detail-full")
    public MatchDetailFullResponse detailFull(@PathVariable Long id, HttpSession session) {
        return matchService.findDetailFull(id, session);
    }

    @GetMapping("/sections")
    public MatchSectionsResponse sections(
            @RequestParam(required = false) SportType sportType,
            @RequestParam(required = false) String leagueName) {
        return matchService.findMatchSections(sportType, leagueName);
    }

    @GetMapping("/{id}/mlb-detail")
    public ResponseEntity<MlbGameDetailResponse> mlbDetail(@PathVariable Long id) {
        MlbGameDetailResponse response = mlbGameDetailService.getDetail(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/mlb-play-by-play")
    public ResponseEntity<MlbPlayByPlayResponse> mlbPlayByPlay(@PathVariable Long id) {
        MlbPlayByPlayResponse response = mlbGameDetailService.getPlayByPlay(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/mlb-pitch-zone")
    public ResponseEntity<MlbPitchZoneResponse> mlbPitchZone(@PathVariable Long id) {
        MlbPitchZoneResponse response = mlbGameDetailService.getPitchZone(id);
        return ResponseEntity.ok(response);
    }
}
