package com.sport.web_sport.soccer.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "FIXTURES")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Fixture {

    @Id
    @Column(name = "FIXTURE_ID", length = 20)
    private String fixtureId;

    @Column(name = "SEASON", length = 10)
    private String season;

    @Column(name = "LEAGUE_ID", length = 20)
    private String leagueId;

    @Column(name = "LEAGUE_NAME", length = 100)
    private String leagueName;

    @Column(name = "ROUND", length = 50)
    private String round;

    @Column(name = "MATCH_DATE")
    private LocalDateTime matchDate;

    @Column(name = "MATCH_DATE_STR", length = 30)
    private String matchDateStr;

    @Column(name = "STATUS", length = 20)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "HOME_TEAM_ID", referencedColumnName = "TEAM_ID",
            insertable = false, updatable = false,
            foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private SoccerTeam homeTeam;

    @Column(name = "HOME_TEAM_ID", length = 20)
    private String homeTeamId;

    @Column(name = "HOME_TEAM_NAME", length = 100)
    private String homeTeamName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AWAY_TEAM_ID", referencedColumnName = "TEAM_ID",
            insertable = false, updatable = false,
            foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private SoccerTeam awayTeam;

    @Column(name = "AWAY_TEAM_ID", length = 20)
    private String awayTeamId;

    @Column(name = "AWAY_TEAM_NAME", length = 100)
    private String awayTeamName;

    @Column(name = "HOME_SCORE", length = 10)
    private String homeScore;

    @Column(name = "AWAY_SCORE", length = 10)
    private String awayScore;

    @Column(name = "VENUE", length = 100)
    private String venue;

    @Column(name = "SPECTATORS", length = 20)
    private String spectators;

    @Column(name = "THUMBNAIL_URL", length = 500)
    private String thumbnailUrl;
}
