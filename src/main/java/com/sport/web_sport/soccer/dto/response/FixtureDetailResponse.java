package com.sport.web_sport.soccer.dto.response;

import com.sport.web_sport.soccer.entity.Fixture;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class FixtureDetailResponse {
    private FixtureResponse fixture;
    private String spectators;
    private String matchDateStr;

    public static FixtureDetailResponse from(Fixture f) {
        if (f == null) return null;
        return FixtureDetailResponse.builder()
                .fixture(FixtureResponse.from(f))
                .spectators(f.getSpectators())
                .matchDateStr(f.getMatchDateStr())
                .build();
    }
}
