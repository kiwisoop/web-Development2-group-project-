package com.sport.web_sport.sports.dto.response;

import com.sport.web_sport.common.type.MatchStatus;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.Match;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class MatchResponse {
    private Long id;
    private SportType sportType;
    private MatchStatus status;
    private String season;
    private LocalDateTime matchDate;
    private String venue;
    private Integer homeScore;
    private Integer awayScore;
    private LeagueResponse league;
    private TeamResponse homeTeam;
    private TeamResponse awayTeam;

    public static MatchResponse from(Match match) {
        if (match == null) return null;
        return MatchResponse.builder()
                .id(match.getId())
                .sportType(match.getSportType())
                .status(match.getStatus())
                .season(match.getSeason())
                .matchDate(match.getMatchDate())
                .venue(match.getVenue())
                .homeScore(match.getHomeScore())
                .awayScore(match.getAwayScore())
                .league(LeagueResponse.from(match.getLeague()))
                .homeTeam(TeamResponse.from(match.getHomeTeam()))
                .awayTeam(TeamResponse.from(match.getAwayTeam()))
                .build();
    }
}
