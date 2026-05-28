package com.sport.web_sport.soccer.service;

import com.sport.web_sport.common.type.AnalysisProvider;
import com.sport.web_sport.common.type.AnalysisStatus;
import com.sport.web_sport.soccer.entity.FixtureAnalysis;
import com.sport.web_sport.soccer.repository.FixtureAnalysisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FixtureAnalysisService {

    private final FixtureAnalysisRepository analysisRepository;
    private final FixtureAnalysisGenerator generator;

    @Transactional(readOnly = true)
    public Optional<FixtureAnalysis> getSavedAnalysis(String fixtureId, AnalysisProvider provider) {
        return analysisRepository.findByFixtureIdAndProvider(fixtureId, provider);
    }

    public FixtureAnalysis generateGeminiAnalysis(String fixtureId) {
        Optional<FixtureAnalysis> existing = getSavedAnalysis(fixtureId, AnalysisProvider.GEMINI);
        if (existing.isPresent() && existing.get().getStatus() == AnalysisStatus.DONE) {
            return existing.get();
        }
        return generator.generate(fixtureId);
    }

    public FixtureAnalysis regenerateGeminiAnalysis(String fixtureId) {
        return generator.generate(fixtureId);
    }
}
