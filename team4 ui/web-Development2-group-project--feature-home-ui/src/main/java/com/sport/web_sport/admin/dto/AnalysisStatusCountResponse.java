package com.sport.web_sport.admin.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AnalysisStatusCountResponse {
    private String status;
    private long count;
}
