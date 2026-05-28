package com.sport.web_sport.soccer.entity;

import com.sport.web_sport.common.type.AnalysisProvider;
import com.sport.web_sport.common.type.AnalysisStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "SOCCER_FIXTURE_ANALYSIS")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FixtureAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "FIXTURE_ID", length = 20, nullable = false)
    private String fixtureId;

    @Enumerated(EnumType.STRING)
    @Column(name = "PROVIDER", length = 20)
    private AnalysisProvider provider;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", length = 20)
    private AnalysisStatus status;

    @Lob
    @Column(name = "SUMMARY_TEXT")
    private String summaryText;

    @Lob
    @Column(name = "TACTICAL_ANALYSIS")
    private String tacticalAnalysis;

    @Lob
    @Column(name = "KEY_POINT")
    private String keyPoint;

    @Lob
    @Column(name = "ERROR_MESSAGE")
    private String errorMessage;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;
}
