package com.sport.web_sport.soccer.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sport.web_sport.common.type.AnalysisProvider;
import com.sport.web_sport.common.type.AnalysisStatus;
import com.sport.web_sport.soccer.entity.FixtureAnalysis;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FixtureAnalysisResponse {
    // 필드명은 기존 MatchAnalysisResponse와 동일하게 유지 → 프론트 AiAnalysisCard 재사용
    private Long id;
    private AnalysisProvider provider;
    private AnalysisStatus status;
    private String summaryText;
    private String tacticalAnalysis;
    private String keyPoint;
    private String errorMessage;
    private LocalDateTime updatedAt;

    @JsonIgnore
    public boolean isEmpty() { return id == null; }

    public static FixtureAnalysisResponse from(FixtureAnalysis a) {
        if (a == null) return notCreated();
        return FixtureAnalysisResponse.builder()
                .id(a.getId())
                .provider(a.getProvider())
                .status(a.getStatus())
                .summaryText(a.getSummaryText())
                .tacticalAnalysis(a.getTacticalAnalysis())
                .keyPoint(a.getKeyPoint())
                .errorMessage(a.getErrorMessage())
                .updatedAt(a.getUpdatedAt())
                .build();
    }

    public static FixtureAnalysisResponse notCreated() {
        return FixtureAnalysisResponse.builder().status(AnalysisStatus.NOT_CREATED).build();
    }
}
