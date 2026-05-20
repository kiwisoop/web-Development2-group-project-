package com.sport.web_sport.sports.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "match_event")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id")
    private Match match;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id")
    private Player player;

    private String eventTime;

    private String eventType;

    private String description;

    private String scoreAfterEvent;
}
