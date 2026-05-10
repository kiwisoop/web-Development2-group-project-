package com.team.sportsanalysis.match;

import com.team.sportsanalysis.common.SportType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "teams")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Team {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private SportType sportType;

    private String name;
    private String leagueName;
    private String logoUrl;
}
