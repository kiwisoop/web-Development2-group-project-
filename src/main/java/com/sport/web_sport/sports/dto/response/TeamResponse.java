package com.sport.web_sport.sports.dto.response;

import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.Team;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class TeamResponse {
    private Long id;
    private SportType sportType;
    private Long leagueId;
    private String leagueName;
    private String teamName;
    private String shortName;
    private String logoUrl;
    private String country;

    public static TeamResponse from(Team team) {
        if (team == null) return null;
        return TeamResponse.builder()
                .id(team.getId())
                .sportType(team.getSportType())
                .leagueId(team.getLeague() != null ? team.getLeague().getId() : null)
                .leagueName(team.getLeague() != null ? team.getLeague().getLeagueName() : null)
                .teamName(team.getTeamName())
                .shortName(team.getShortName())
                .logoUrl(team.getLogoUrl())
                .country(team.getCountry())
                .build();
    }
}
