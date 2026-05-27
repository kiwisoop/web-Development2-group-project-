package com.sport.web_sport.baseball.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class MlbLinescoreResponse {
    private List<MlbInningScoreResponse> innings;
    private int currentInning;
    private String currentInningOrdinal;
    private int homeRuns;
    private int homeHits;
    private int homeErrors;
    private int awayRuns;
    private int awayHits;
    private int awayErrors;
}
