package com.sport.web_sport.baseball.controller;

import com.sport.web_sport.baseball.dto.response.MlbAnalysisResponse;
import com.sport.web_sport.baseball.service.MlbAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class MlbAnalysisController {

    private final MlbAnalysisService mlbAnalysisService;

    @GetMapping("/api/matches/{matchId}/mlb-analysis")
    public MlbAnalysisResponse getAnalysis(@PathVariable Long matchId) {
        return mlbAnalysisService.analyze(matchId);
    }
}
