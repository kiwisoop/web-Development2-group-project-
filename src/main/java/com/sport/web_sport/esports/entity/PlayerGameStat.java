package com.sport.web_sport.esports.entity;

import com.sport.web_sport.sports.entity.Player;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "player_game_stat")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerGameStat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stat_id")
    private Long statId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    private Game game;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id")
    private Player player;

    @Column(name = "champion_name")
    private String championName;

    @Builder.Default private Integer kills        = 0;
    @Builder.Default private Integer deaths       = 0;
    @Builder.Default private Integer assists      = 0;
    @Builder.Default private Integer cs           = 0;
    @Builder.Default private Integer gold         = 0;
    @Builder.Default private Integer damage       = 0;
    @Column(name = "vision_score")
    @Builder.Default private Integer visionScore  = 0;

    /** 분당 딜량 */
    @Builder.Default private Double dpm = 0.0;

    /** 팀 내 딜 비율 (%) */
    @Column(name = "team_damage_ratio")
    @Builder.Default private Double teamDamageRatio = 0.0;
}
