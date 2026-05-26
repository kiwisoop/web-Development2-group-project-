package com.sport.web_sport.favorite.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sport.web_sport.common.type.SportType;
import com.sport.web_sport.sports.entity.Team;
import com.sport.web_sport.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "favorite_team")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriteTeam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @Enumerated(EnumType.STRING)
    private SportType sportType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    private String teamName;

    private LocalDateTime createdAt;
}
