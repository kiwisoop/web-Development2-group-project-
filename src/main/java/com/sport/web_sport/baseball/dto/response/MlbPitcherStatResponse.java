package com.sport.web_sport.baseball.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MlbPitcherStatResponse {
    private String fullName;
    private String inningsPitched;
    private String hits;
    private String runs;
    private String earnedRuns;
    private String baseOnBalls;
    private String strikeOuts;
    private String numberOfPitches;
    private String era;
}
