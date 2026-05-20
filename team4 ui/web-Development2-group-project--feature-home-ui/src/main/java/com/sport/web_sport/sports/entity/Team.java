package com.sport.web_sport.sports.entity;

import com.sport.web_sport.common.type.SportType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "team")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private SportType sportType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "league_id")
    private League league;

    private String teamName;

    private String shortName;

    private String logoUrl;

    private String country;
}
