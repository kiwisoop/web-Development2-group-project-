package com.sport.web_sport.analysis.entity;

import com.sport.web_sport.common.type.AnalysisProvider;
import com.sport.web_sport.common.type.AnalysisStatus;
import com.sport.web_sport.sports.entity.Match;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "match_analysis")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id")
    private Match match;

    @Enumerated(EnumType.STRING)
    private AnalysisProvider provider;

    @Enumerated(EnumType.STRING)
    private AnalysisStatus status;

    @Lob
    private String summaryText;

    @Lob
    private String tacticalAnalysis;

    @Lob
    private String keyPoint;

    @Lob
    private String errorMessage;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
