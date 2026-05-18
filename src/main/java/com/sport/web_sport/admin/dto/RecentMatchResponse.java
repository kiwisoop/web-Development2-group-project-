package com.sport.web_sport.admin.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RecentMatchResponse {
    private Long matchId;
    private String homeTeamName;
    private String awayTeamName;
    private String sportType;
    private String status;
    private LocalDateTime matchDate;
    private Integer homeScore;
    private Integer awayScore;
}
