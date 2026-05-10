package com.team.sportsanalysis.match;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "match_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MatchEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long matchId;
    private String eventTime; // e.g. "23'" or "Q2 05:12"
    private String teamName;
    private String playerName;
    private String eventType; // GOAL, ASSIST, FOUL, SUB, etc.

    @Column(length = 500)
    private String description;
}
