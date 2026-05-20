package com.sport.web_sport.analysis.controller;

import com.sport.web_sport.analysis.entity.MatchAnalysis;
import com.sport.web_sport.analysis.service.AnalysisService;
import com.sport.web_sport.common.type.AnalysisProvider;
import com.sport.web_sport.sports.dto.response.AnalysisResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AnalysisApiController {

    private final AnalysisService analysisService;

    @GetMapping("/api/matches/{matchId}/analysis")
    public ResponseEntity<AnalysisResponse> getMatchAnalysis(
            @PathVariable Long matchId,
            @RequestParam(defaultValue = "GEMINI") AnalysisProvider provider) {
        return analysisService.getSavedAnalysis(matchId, provider)
                .map(a -> ResponseEntity.ok(AnalysisResponse.from(a)))
                .orElseGet(() -> ResponseEntity.ok(AnalysisResponse.notCreated()));
    }

    @PostMapping("/api/matches/{matchId}/analysis/generate")
    public AnalysisResponse generate(@PathVariable Long matchId) {
        return AnalysisResponse.from(analysisService.generateGeminiAnalysis(matchId));
    }

    @PostMapping("/api/matches/{matchId}/analysis/regenerate")
    public AnalysisResponse regenerate(@PathVariable Long matchId) {
        return AnalysisResponse.from(analysisService.regenerateGeminiAnalysis(matchId));
    }

    @GetMapping("/api/analysis/match/{matchId}")
    public ResponseEntity<MatchAnalysis> getLegacy(@PathVariable Long matchId,
                                                   @RequestParam(defaultValue = "MOCK") AnalysisProvider provider) {
        return analysisService.getAnalysis(matchId, provider)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/api/analysis/match/{matchId}/mock")
    public MatchAnalysis createMock(@PathVariable Long matchId) {
        return analysisService.createMockAnalysis(matchId);
    }
}
