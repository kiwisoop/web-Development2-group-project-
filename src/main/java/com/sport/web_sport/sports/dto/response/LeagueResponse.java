package com.sport.web_sport.sports.dto.response;

import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.League;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class LeagueResponse {
    private Long id;
    private SportType sportType;
    private String leagueName;
    private String season;
    private String country;

    public static LeagueResponse from(League league) {
        if (league == null) return null;
        return LeagueResponse.builder()
                .id(league.getId())
                .sportType(league.getSportType())
                .leagueName(league.getLeagueName())
                .season(league.getSeason())
                .country(league.getCountry())
                .build();
    }
}
