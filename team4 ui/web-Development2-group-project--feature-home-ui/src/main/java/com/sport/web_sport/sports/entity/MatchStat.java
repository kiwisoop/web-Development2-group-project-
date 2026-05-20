package com.sport.web_sport.sports.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "match_stat")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchStat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id")
    private Match match;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    private String statName;

    private String statValue;
}
