package com.sport.web_sport.soccer.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "STANDINGS")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Standing {

    @Id
    @Column(name = "STANDING_ID")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long standingId;

    @Column(name = "LEAGUE_ID", length = 20)
    private String leagueId;

    @Column(name = "SEASON", length = 10)
    private String season;

    @Column(name = "TEAM_ID", length = 20)
    private String teamId;

    @Column(name = "TEAM_NAME", length = 100)
    private String teamName;

    // Backtick tells Hibernate to use the dialect's quoted-identifier form, preserving case
    // and avoiding Spring's PhysicalNamingStrategy lowercasing. Oracle stores RANK as RANK.
    @Column(name = "`RANK`")
    private Integer rankPosition;

    @Column(name = "PLAYED")
    private Integer played;

    @Column(name = "WINS")
    private Integer wins;

    @Column(name = "DRAWS")
    private Integer draws;

    @Column(name = "LOSSES")
    private Integer losses;

    @Column(name = "GOALS_FOR")
    private Integer goalsFor;

    @Column(name = "GOALS_AGAINST")
    private Integer goalsAgainst;

    @Column(name = "GOAL_DIFF")
    private Integer goalDiff;

    @Column(name = "POINTS")
    private Integer points;

    @Column(name = "STANDING_DESC", length = 200)
    private String standingDesc;
}
