package com.sport.web_sport.baseball.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MlbLineupPlayerResponse {
    private int battingOrder;   // 1-9; 0 for pitchers/non-batters
    private String fullName;
    private String position;    // position abbreviation, e.g. "SS", "DH"
    private String jerseyNumber;
}
