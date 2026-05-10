package com.team.sportsanalysis.favorite;

import com.team.sportsanalysis.common.SportType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "favorite_teams")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FavoriteTeam {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    @Enumerated(EnumType.STRING)
    private SportType sportType;

    private String teamName;
}
