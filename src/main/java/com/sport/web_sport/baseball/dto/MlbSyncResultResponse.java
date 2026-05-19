package com.sport.web_sport.baseball.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MlbSyncResultResponse {

    private String requestedStartDate;
    private String requestedEndDate;
    private int fetchedGames;
    private int createdMatches;
    private int updatedMatches;
    private int createdTeams;
    private int skippedGames;
    private String message;
}
