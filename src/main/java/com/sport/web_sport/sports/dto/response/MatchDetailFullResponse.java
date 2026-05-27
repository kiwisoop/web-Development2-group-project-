package com.sport.web_sport.sports.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class MatchDetailFullResponse {
    private MatchResponse match;
    private TeamResponse homeTeam;
    private TeamResponse awayTeam;
    private LeagueResponse league;
    private List<MatchStatResponse> stats;
    private List<MatchEventResponse> events;
    private boolean homeTeamFavorite;
    private boolean awayTeamFavorite;
    private boolean loggedIn;
}
