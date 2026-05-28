package com.sport.web_sport.soccer.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "TEAMS")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SoccerTeam {

    @Id
    @Column(name = "TEAM_ID", length = 20)
    private String teamId;

    @Column(name = "TEAM_NAME", length = 100)
    private String teamName;

    @Column(name = "TEAM_NAME_KR", length = 100)
    private String teamNameKr;

    @Column(name = "SHORT_NAME", length = 50)
    private String shortName;

    @Column(name = "STADIUM", length = 100)
    private String stadium;

    @Column(name = "CITY", length = 100)
    private String city;

    @Column(name = "FOUNDED", length = 10)
    private String founded;

    @Column(name = "LOGO_URL", length = 500)
    private String logoUrl;

    @Column(name = "BANNER_URL", length = 500)
    private String bannerUrl;

    @Lob
    @Column(name = "TEAM_DESC")
    private String teamDesc;
}
