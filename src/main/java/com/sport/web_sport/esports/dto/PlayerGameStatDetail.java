package com.sport.web_sport.esports.dto;

import java.time.LocalDateTime;

/**
 * 선수의 경기별 상세 지표
 * - 분당 딜량(DPM), 골드 총 획득량, 시야 점수, 팀 내 데미지 비율 등
 */
public record PlayerGameStatDetail(
        Long           gameId,
        Long           matchId,
        Integer        gameNumber,
        LocalDateTime  matchDate,
        String         season,
        String         opponentName,
        String         opponentCode,
        Boolean        win,
        String         championName,
        Integer        kills,
        Integer        deaths,
        Integer        assists,
        Integer        cs,
        Integer        gold,
        Integer        damage,
        Double         dpm,
        Double         teamDamageRatio,
        Integer        visionScore,
        Integer        durationSec
) {}
