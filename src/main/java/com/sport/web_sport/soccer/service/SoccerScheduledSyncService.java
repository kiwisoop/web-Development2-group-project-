package com.sport.web_sport.soccer.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class SoccerScheduledSyncService {

    private final SoccerSyncService soccerSyncService;

    @Scheduled(cron = "0 15 3 * * *")
    public void dailySync() {
        LocalDate today = LocalDate.now();
        try {
            soccerSyncService.sync(today.minusDays(30).toString(), today.plusDays(60).toString());
        } catch (Exception e) {
            log.warn("Soccer daily sync failed: {}", e.getMessage());
        }
    }
}
