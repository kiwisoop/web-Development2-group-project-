package com.sport.web_sport.prediction.controller;

import com.sport.web_sport.common.response.ApiResponse;
import com.sport.web_sport.prediction.dto.PredictionResultResponse;
import com.sport.web_sport.prediction.dto.PredictionVoteRequest;
import com.sport.web_sport.prediction.service.PredictionService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/matches/{matchId}/prediction")
@RequiredArgsConstructor
public class PredictionController {

    private final PredictionService predictionService;

    @GetMapping
    public ApiResponse<PredictionResultResponse> getResult(
            @PathVariable Long matchId,
            HttpSession session) {
        return ApiResponse.ok(predictionService.getPredictionResult(matchId, session));
    }

    @PostMapping("/vote")
    public ApiResponse<PredictionResultResponse> vote(
            @PathVariable Long matchId,
            @RequestBody PredictionVoteRequest request,
            HttpSession session) {
        return ApiResponse.ok(predictionService.vote(matchId, request.getVoteOption(), session));
    }
}
