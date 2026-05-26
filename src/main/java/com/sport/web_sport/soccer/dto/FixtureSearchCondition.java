package com.sport.web_sport.soccer.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class FixtureSearchCondition {

    private String season;
    private String status;   // "FT" | "NS" | null
    private String teamId;
    private String keyword;

    private Integer page = 0;
    private Integer size = 20;
    private String sort = "latest";  // "latest" | "oldest"

    public int getPageOrDefault() { return page == null || page < 0 ? 0 : page; }

    public int getSizeOrDefault() {
        if (size == null || size < 1) return 20;
        if (size > 100) return 100;
        return size;
    }

    public String getSortOrDefault() {
        if (sort == null) return "latest";
        return switch (sort) {
            case "oldest", "latest" -> sort;
            default -> "latest";
        };
    }

    public String getKeywordOrNull() {
        return (keyword == null || keyword.isBlank()) ? null : keyword;
    }
}
