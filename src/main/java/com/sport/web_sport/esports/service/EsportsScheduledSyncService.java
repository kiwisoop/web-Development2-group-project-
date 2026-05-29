package com.sport.web_sport.esports.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class EsportsScheduledSyncService {

    private final EsportsSyncService esportsSyncService;

    @Scheduled(cron = "0 30 3 * * *")
    public void dailySync() {
        LocalDate today = LocalDate.now();
        try {
            esportsSyncService.sync(today.minusDays(30).toString(), today.plusDays(60).toString());
        } catch (Exception e) {
            log.warn("Esports daily sync failed: {}", e.getMessage());
        }
    }
}
