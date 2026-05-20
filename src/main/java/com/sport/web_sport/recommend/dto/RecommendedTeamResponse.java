package com.sport.web_sport.recommend.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 추천팀(맞춤 분석) 응답 DTO.
 *
 * 프론트 {@code recommendedTeamsMock.js} 구조와 동일한 형태를 유지하여
 * GET /api/users/me/recommended-teams 의 {@code ApiResponse.data} 로 그대로 사용된다.
 *
 * v1(조회 전용)에서 DB 직접 출처가 없는 필드는 다음과 같이 채운다.
 * - ranking    : null (추후 순위 산출 로직 연동)
 * - riskFactor : null (추후 분석 데이터에서 도출)
 * - alerts     : 빈 배열 (추후 알림 계산)
 * 단, nextMatch 는 프론트 카드가 non-null 을 전제로 하므로 항상 객체로 반환한다.
 */
@Getter
@Builder
public class RecommendedTeamResponse {

    private Long id;
    private String teamName;
    private String sport;        // SOCCER | BASEBALL | ESPORTS
    private String sportLabel;   // 화면 표시용 (축구 | 야구 | E스포츠)
    private String league;
    private String ranking;      // v1: null
    private NextMatch nextMatch; // 항상 non-null
    private String analysisStatus; // READY | IN_PROGRESS | PENDING
    private List<String> recentForm; // ['승' | '무' | '패', ...]
    private String aiInsight;
    private String keyPoint;
    private String riskFactor;   // v1: null
    private List<String> alerts; // v1: []

    @Getter
    @Builder
    public static class NextMatch {
        private String opponent;
        private String dateTime;
    }
}
