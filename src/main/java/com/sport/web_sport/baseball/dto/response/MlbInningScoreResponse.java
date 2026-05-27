package com.sport.web_sport.baseball.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MlbInningScoreResponse {
    private int inningNumber;
    private String homeRuns;  // "X" when inning not yet played
    private String awayRuns;
}
