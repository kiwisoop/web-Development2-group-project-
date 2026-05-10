package com.team.sportsanalysis.mlb;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BaseballSummaryResponse {
    private Long gamePk;
    private String mode; // MOCK | GEMINI
    private String summaryText;
    private String tacticalAnalysis;
    private String keyPoint;
    private String errorMessage;
}
