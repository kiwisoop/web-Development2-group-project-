package com.sport.web_sport.baseball.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class MlbScheduledSyncService {

    private final MlbSyncService mlbSyncService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Scheduled(cron = "0 0 3 * * *")
    public void dailySync() {
        String start = LocalDate.now().minusDays(2).format(DATE_FMT);
        String end = LocalDate.now().plusDays(7).format(DATE_FMT);
        try {
            var result = mlbSyncService.sync(start, end);
            log.info("MLB daily sync done: fetched={}, created={}, updated={}, skipped={}",
                    result.getFetchedGames(), result.getCreatedMatches(),
                    result.getUpdatedMatches(), result.getSkippedGames());
        } catch (Exception e) {
            log.warn("MLB daily sync failed: {}", e.getMessage(), e);
        }
    }

    @Scheduled(fixedRate = 300_000)
    public void liveSync() {
        String start = LocalDate.now().minusDays(1).format(DATE_FMT);
        String end = LocalDate.now().plusDays(1).format(DATE_FMT);
        try {
            var result = mlbSyncService.sync(start, end);
            log.info("MLB live sync done: fetched={}, created={}, updated={}, skipped={}",
                    result.getFetchedGames(), result.getCreatedMatches(),
                    result.getUpdatedMatches(), result.getSkippedGames());
        } catch (Exception e) {
            log.warn("MLB live sync failed: {}", e.getMessage(), e);
        }
    }
}
