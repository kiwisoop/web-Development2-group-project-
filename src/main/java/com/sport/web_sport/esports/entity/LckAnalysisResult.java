package com.sport.web_sport.esports.entity;

import com.sport.web_sport.sports.entity.Player;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "analysis_result")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LckAnalysisResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "analysis_id")
    private Long analysisId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    private Game game;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String summary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "key_player_id")
    private Player keyPlayer;

    @Column(name = "team_fight_score")
    @Builder.Default private Double teamFightScore = 0.0;

    @Column(name = "objective_score")
    @Builder.Default private Double objectiveScore = 0.0;

    @Column(name = "created_at")
    @Builder.Default private LocalDateTime createdAt = LocalDateTime.now();
}
