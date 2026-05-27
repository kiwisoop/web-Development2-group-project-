package com.sport.web_sport.esports.entity;

import com.sport.web_sport.sports.entity.Team;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "team_game_stat")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamGameStat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stat_id")
    private Long statId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    private Game game;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(name = "tower_kills")
    @Builder.Default private Integer towerKills    = 0;

    @Column(name = "dragon_kills")
    @Builder.Default private Integer dragonKills   = 0;

    @Column(name = "baron_kills")
    @Builder.Default private Integer baronKills    = 0;

    @Column(name = "herald_kills")
    @Builder.Default private Integer heraldKills   = 0;

    /** 공허 유충 처치 수 */
    @Column(name = "void_grub_kills")
    @Builder.Default private Integer voidGrubKills = 0;

    @Column(name = "total_gold")
    @Builder.Default private Integer totalGold     = 0;

    @Column(name = "total_kills")
    @Builder.Default private Integer totalKills    = 0;
}
