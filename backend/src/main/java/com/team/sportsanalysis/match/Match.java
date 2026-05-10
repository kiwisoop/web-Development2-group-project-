package com.team.sportsanalysis.match;

import com.team.sportsanalysis.common.SportType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "matches")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Match {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private SportType sportType;

    private String leagueName;
    private LocalDateTime matchDate;
    private String homeTeam;
    private String awayTeam;
    private Integer homeScore;
    private Integer awayScore;
    private String venue;
    private String status; // SCHEDULED / LIVE / FINISHED

    @Column(length = 1000)
    private String basicSummary;
}
