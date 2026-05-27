package com.sport.web_sport.sports.entity;

import com.sport.web_sport.common.type.SportType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "league")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class League {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private SportType sportType;

    private String leagueName;

    private String season;

    private String country;
}
