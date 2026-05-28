package com.sport.web_sport.esports.entity;

import com.sport.web_sport.sports.entity.Player;
import com.sport.web_sport.sports.entity.Team;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "timeline_event")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LckTimelineEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    private Long eventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    private Game game;

    /** 게임 시작 기준 경과 시간(초) */
    @Column(name = "event_time")
    private Integer eventTime;

    /**
     * 이벤트 종류: FIRST_BLOOD, KILL, DRAGON, BARON, HERALD,
     * TOWER, VOID_GRUB, ACE, GAME_END
     */
    @Column(name = "event_type")
    private String eventType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id")
    private Player player;

    private String description;
}
