package com.sport.web_sport.esports.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class LckCitoAnalysisRequest {
    private String  team1Code;
    private String  team1Name;
    private Integer team1Score;
    private String  team2Code;
    private String  team2Name;
    private Integer team2Score;
    private String  blockName;
    private String  matchDate;
    private Integer boCount;
}
