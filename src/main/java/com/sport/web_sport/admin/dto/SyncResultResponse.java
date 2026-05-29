package com.sport.web_sport.admin.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SyncResultResponse {
    private String sportType;
    private String requestedStartDate;
    private String requestedEndDate;
    private int fetchedGames;
    private int createdMatches;
    private int updatedMatches;
    private int createdTeams;
    private int skippedGames;
    private String message;
}
