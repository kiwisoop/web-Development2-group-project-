package com.sport.web_sport.sports.dto;

import com.sport.web_sport.common.type.MatchStatus;
import com.sport.web_sport.common.type.SportType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class MatchSearchCondition {

    private SportType sportType;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate date;

    private Integer year;
    private Integer month;
    private MatchStatus status;
    private Long teamId;
    private Long leagueId;
    private String keyword;

    private Integer page = 0;
    private Integer size = 20;
    private String sort = "latest";

    public int getPageOrDefault() { return page == null || page < 0 ? 0 : page; }
    public int getSizeOrDefault() {
        if (size == null || size < 1) return 20;
        if (size > 100) return 100;
        return size;
    }
    public String getSortOrDefault() {
        if (sort == null) return "latest";
        return switch (sort) {
            case "oldest", "liveFirst", "latest" -> sort;
            default -> "latest";
        };
    }
}
