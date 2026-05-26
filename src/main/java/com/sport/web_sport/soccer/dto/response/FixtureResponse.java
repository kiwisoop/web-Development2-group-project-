package com.sport.web_sport.soccer.dto.response;

import com.sport.web_sport.soccer.entity.Fixture;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class FixtureResponse {
    private String id;
    private String sportType;   // always "SOCCER"
    private String status;      // "FINAL" | "SCHEDULED" (normalized from FT/NS)
    private String season;
    private String round;
    private String leagueName;
    private LocalDateTime matchDate;
    private String venue;
    private String thumbnailUrl;
    private Integer homeScore;
    private Integer awayScore;
    private SoccerTeamResponse homeTeam;
    private SoccerTeamResponse awayTeam;

    public static FixtureResponse from(Fixture f) {
        if (f == null) return null;

        SoccerTeamResponse home = f.getHomeTeam() != null
                ? SoccerTeamResponse.summary(f.getHomeTeam())
                : SoccerTeamResponse.builder()
                        .id(f.getHomeTeamId())
                        .teamName(f.getHomeTeamName())
                        .build();

        SoccerTeamResponse away = f.getAwayTeam() != null
                ? SoccerTeamResponse.summary(f.getAwayTeam())
                : SoccerTeamResponse.builder()
                        .id(f.getAwayTeamId())
                        .teamName(f.getAwayTeamName())
                        .build();

        return FixtureResponse.builder()
                .id(f.getFixtureId())
                .sportType("SOCCER")
                .status(normalizeStatus(f.getStatus()))
                .season(f.getSeason())
                .round(f.getRound())
                .leagueName(f.getLeagueName())
                .matchDate(f.getMatchDate())
                .venue(f.getVenue())
                .thumbnailUrl(f.getThumbnailUrl())
                .homeScore(parseScore(f.getHomeScore()))
                .awayScore(parseScore(f.getAwayScore()))
                .homeTeam(home)
                .awayTeam(away)
                .build();
    }

    static String normalizeStatus(String raw) {
        if (raw == null) return null;
        return switch (raw) {
            case "FT" -> "FINAL";
            case "NS" -> "SCHEDULED";
            default -> raw;
        };
    }

    static Integer parseScore(String s) {
        if (s == null || s.isBlank()) return null;
        try { return Integer.valueOf(s.trim()); }
        catch (NumberFormatException e) { return null; }
    }
}
