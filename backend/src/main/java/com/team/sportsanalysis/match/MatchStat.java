package com.team.sportsanalysis.match;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "match_stats")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MatchStat {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long matchId;
    private String teamName;
    private String statName;
    private String statValue;
}
