package com.sport.web_sport.admin.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SportMatchCountResponse {
    private String sportType;
    private long count;
}
