package com.sport.web_sport.sports.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sport.web_sport.analysis.entity.MatchAnalysis;
import com.sport.web_sport.common.type.AnalysisProvider;
import com.sport.web_sport.common.type.AnalysisStatus;
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
public class AnalysisResponse {
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

    public static AnalysisResponse from(MatchAnalysis a) {
        if (a == null) return notCreated();
        return AnalysisResponse.builder()
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

    public static AnalysisResponse notCreated() {
        return AnalysisResponse.builder().status(AnalysisStatus.NOT_CREATED).build();
    }
}
