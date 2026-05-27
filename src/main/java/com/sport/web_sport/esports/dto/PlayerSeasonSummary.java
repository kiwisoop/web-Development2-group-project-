package com.sport.web_sport.esports.dto;

/**
 * 선수의 시즌별 통합 지표
 * - 시즌 단위로 K/D/A 합산, 평균, KDA, 승/패 집계
 */
public record PlayerSeasonSummary(
        String  season,
        Long    playerId,
        String  nickname,
        String  position,
        Integer totalGames,
        Integer totalKills,
        Integer totalDeaths,
        Integer totalAssists,
        Double  avgKills,
        Double  avgDeaths,
        Double  avgAssists,
        Double  kda,           // (K + A) / max(D, 1)
        Integer wins,
        Integer losses,
        Double  winRate
) {}
