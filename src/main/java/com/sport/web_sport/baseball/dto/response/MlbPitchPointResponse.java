package com.sport.web_sport.baseball.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MlbPitchPointResponse {
    private int inning;
    private String halfInning;
    private String batterName;
    private String pitcherName;
    private String pitchType;
    private String pitchDescription;
    private String callDescription;
    private boolean isBall;
    private boolean isStrike;
    private boolean isInPlay;
    private Integer zone;
    private Double plateX;
    private Double plateZ;
    private Double strikeZoneTop;
    private Double strikeZoneBottom;
    private Double startSpeed;
    private Double endSpeed;
}
