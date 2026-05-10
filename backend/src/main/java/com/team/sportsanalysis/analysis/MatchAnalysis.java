package com.team.sportsanalysis.analysis;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "match_analyses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MatchAnalysis {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private Long matchId;

    @Column(length = 2000)
    private String summaryText;

    @Column(length = 2000)
    private String tacticalAnalysis;

    @Column(length = 1000)
    private String keyPoint;
}
