package com.sport.web_sport.baseball.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MlbPlayEventResponse {
    private int inning;
    private String halfInning;
    private String batterName;
    private String pitcherName;
    private String event;
    private String description;
    private int rbi;
    private int awayScore;
    private int homeScore;
    private int balls;
    private int strikes;
    private int outs;
}
