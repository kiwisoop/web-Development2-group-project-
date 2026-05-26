package com.sport.web_sport.sports.entity;

import com.sport.web_sport.common.type.SportType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "player")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private SportType sportType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    private String playerName;

    private Integer backNumber;

    private String position;

    private String nickname;

    private String nationality;
}
