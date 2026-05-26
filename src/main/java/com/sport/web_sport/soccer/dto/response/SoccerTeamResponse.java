package com.sport.web_sport.soccer.dto.response;

import com.sport.web_sport.soccer.entity.SoccerTeam;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class SoccerTeamResponse {
    private String id;
    private String teamName;
    private String teamNameKr;
    private String shortName;
    private String stadium;
    private String city;
    private String founded;
    private String logoUrl;
    private String bannerUrl;
    private String teamDesc;

    public static SoccerTeamResponse from(SoccerTeam t) {
        if (t == null) return null;
        return SoccerTeamResponse.builder()
                .id(t.getTeamId())
                .teamName(t.getTeamName())
                .teamNameKr(t.getTeamNameKr())
                .shortName(t.getShortName())
                .stadium(t.getStadium())
                .city(t.getCity())
                .founded(t.getFounded())
                .logoUrl(t.getLogoUrl())
                .bannerUrl(t.getBannerUrl())
                .teamDesc(t.getTeamDesc())
                .build();
    }

    public static SoccerTeamResponse summary(SoccerTeam t) {
        if (t == null) return null;
        return SoccerTeamResponse.builder()
                .id(t.getTeamId())
                .teamName(t.getTeamName())
                .teamNameKr(t.getTeamNameKr())
                .shortName(t.getShortName())
                .logoUrl(t.getLogoUrl())
                .build();
    }
}
