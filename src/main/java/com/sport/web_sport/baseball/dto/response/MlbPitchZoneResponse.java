package com.sport.web_sport.baseball.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class MlbPitchZoneResponse {
    private Long matchId;
    private long gamePk;
    private int totalPitches;
    private List<MlbPitchPointResponse> pitches;
}
