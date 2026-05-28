package com.sport.web_sport.esports.entity;

import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.sports.entity.Team;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "game")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "game_id")
    private Long gameId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id")
    private Match match;

    @Column(name = "game_number")
    private Integer gameNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blue_team_id")
    private Team blueTeam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "red_team_id")
    private Team redTeam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_team_id")
    private Team winnerTeam;

    /** 게임 시간 (초) */
    private Integer duration;
}
