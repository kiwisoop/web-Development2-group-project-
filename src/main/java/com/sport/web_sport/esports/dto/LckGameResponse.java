package com.sport.web_sport.esports.dto;

import com.sport.web_sport.esports.entity.*;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/** 게임 상세 응답 DTO */
@Data
@Builder
public class LckGameResponse {

    private Long gameId;
    private Integer gameNumber;
    private String blueTeamName;
    private String redTeamName;
    private String winnerTeamName;
    private Integer duration;
    private String durationFormatted; // MM:SS

    private List<PlayerStatItem> bluePlayerStats;
    private List<PlayerStatItem> redPlayerStats;
    private TeamStatItem blueTeamStat;
    private TeamStatItem redTeamStat;
    private List<TimelineItem> timeline;
    private AnalysisItem analysis;

    @Data @Builder
    public static class PlayerStatItem {
        private String playerNickname;
        private String position;
        private String championName;
        private Integer kills;
        private Integer deaths;
        private Integer assists;
        private String kda;
        private Integer cs;
        private Integer gold;
        private Integer damage;
        private Integer visionScore;
        private Double dpm;
        private Double teamDamageRatio;
    }

    @Data @Builder
    public static class TeamStatItem {
        private String teamName;
        private Integer towerKills;
        private Integer dragonKills;
        private Integer baronKills;
        private Integer heraldKills;
        private Integer voidGrubKills;
        private Integer totalGold;
        private Integer totalKills;
    }

    @Data @Builder
    public static class TimelineItem {
        private Integer eventTime;
        private String  eventTimeFormatted; // MM:SS
        private String  eventType;
        private String  teamName;
        private String  playerNickname;
        private String  description;
    }

    @Data @Builder
    public static class AnalysisItem {
        private String keyPlayerNickname;
        private Double teamFightScore;
        private Double objectiveScore;
        private String summary;
    }

    public static LckGameResponse from(Game game,
                                       List<PlayerGameStat> blueStats,
                                       List<PlayerGameStat> redStats,
                                       TeamGameStat blueStat,
                                       TeamGameStat redStat,
                                       List<LckTimelineEvent> events,
                                       LckAnalysisResult analysis) {
        int dur = game.getDuration() != null ? game.getDuration() : 0;
        return LckGameResponse.builder()
            .gameId(game.getGameId())
            .gameNumber(game.getGameNumber())
            .blueTeamName(game.getBlueTeam().getTeamName())
            .redTeamName(game.getRedTeam().getTeamName())
            .winnerTeamName(game.getWinnerTeam() != null ? game.getWinnerTeam().getTeamName() : null)
            .duration(dur)
            .durationFormatted(formatSeconds(dur))
            .bluePlayerStats(blueStats.stream().map(LckGameResponse::toPlayerItem).toList())
            .redPlayerStats(redStats.stream().map(LckGameResponse::toPlayerItem).toList())
            .blueTeamStat(blueStat != null ? toTeamItem(blueStat) : null)
            .redTeamStat(redStat != null ? toTeamItem(redStat) : null)
            .timeline(events.stream().map(LckGameResponse::toTimelineItem).toList())
            .analysis(analysis != null ? toAnalysisItem(analysis) : null)
            .build();
    }

    private static PlayerStatItem toPlayerItem(PlayerGameStat s) {
        int d = s.getDeaths() == 0 ? 1 : s.getDeaths();
        String kda = String.format("%.2f", (s.getKills() + s.getAssists()) / (double) d);
        return PlayerStatItem.builder()
            .playerNickname(s.getPlayer().getNickname())
            .position(s.getPlayer().getPosition())
            .championName(s.getChampionName())
            .kills(s.getKills()).deaths(s.getDeaths()).assists(s.getAssists())
            .kda(kda).cs(s.getCs()).gold(s.getGold())
            .damage(s.getDamage()).visionScore(s.getVisionScore())
            .dpm(s.getDpm()).teamDamageRatio(s.getTeamDamageRatio())
            .build();
    }

    private static TeamStatItem toTeamItem(TeamGameStat s) {
        return TeamStatItem.builder()
            .teamName(s.getTeam().getTeamName())
            .towerKills(s.getTowerKills()).dragonKills(s.getDragonKills())
            .baronKills(s.getBaronKills()).heraldKills(s.getHeraldKills())
            .voidGrubKills(s.getVoidGrubKills())
            .totalGold(s.getTotalGold()).totalKills(s.getTotalKills())
            .build();
    }

    private static TimelineItem toTimelineItem(LckTimelineEvent e) {
        return TimelineItem.builder()
            .eventTime(e.getEventTime())
            .eventTimeFormatted(formatSeconds(e.getEventTime()))
            .eventType(e.getEventType())
            .teamName(e.getTeam() != null ? e.getTeam().getTeamName() : null)
            .playerNickname(e.getPlayer() != null ? e.getPlayer().getNickname() : null)
            .description(e.getDescription())
            .build();
    }

    private static AnalysisItem toAnalysisItem(LckAnalysisResult a) {
        return AnalysisItem.builder()
            .keyPlayerNickname(a.getKeyPlayer() != null ? a.getKeyPlayer().getNickname() : null)
            .teamFightScore(a.getTeamFightScore())
            .objectiveScore(a.getObjectiveScore())
            .summary(a.getSummary())
            .build();
    }

    private static String formatSeconds(int seconds) {
        return String.format("%02d:%02d", seconds / 60, seconds % 60);
    }
}
