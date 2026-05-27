package com.sport.web_sport.baseball.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MlbBatterStatResponse {
    private String fullName;
    private String position;
    private int battingOrder;
    private String atBats;
    private String runs;
    private String hits;
    private String rbi;
    private String baseOnBalls;
    private String strikeOuts;
    private String homeRuns;
    private String doubles;
    private String triples;
}
