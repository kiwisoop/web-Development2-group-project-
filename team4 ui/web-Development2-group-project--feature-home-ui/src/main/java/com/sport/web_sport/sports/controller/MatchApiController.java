package com.sport.web_sport.sports.controller;

import com.sport.web_sport.sports.dto.MatchSearchCondition;
import com.sport.web_sport.sports.dto.response.MatchDetailFullResponse;
import com.sport.web_sport.sports.dto.response.MatchEventResponse;
import com.sport.web_sport.sports.dto.response.MatchResponse;
import com.sport.web_sport.sports.dto.response.MatchStatResponse;
import com.sport.web_sport.sports.dto.response.PageResponse;
import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.sports.service.MatchService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchApiController {

    private final MatchService matchService;

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
}
