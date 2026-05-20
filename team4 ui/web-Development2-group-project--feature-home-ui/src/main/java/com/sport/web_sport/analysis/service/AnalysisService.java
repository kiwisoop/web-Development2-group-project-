package com.sport.web_sport.analysis.service;

import com.sport.web_sport.analysis.entity.MatchAnalysis;
import com.sport.web_sport.analysis.repository.MatchAnalysisRepository;
import com.sport.web_sport.common.error.BusinessException;
import com.sport.web_sport.common.type.AnalysisProvider;
import com.sport.web_sport.common.type.AnalysisStatus;
import com.sport.web_sport.sports.entity.Match;
import com.sport.web_sport.sports.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final MatchAnalysisRepository matchAnalysisRepository;
    private final MatchRepository matchRepository;
    private final AnalysisGenerator geminiGenerator;

    @Transactional(readOnly = true)
    public Optional<MatchAnalysis> getAnalysis(Long matchId, AnalysisProvider provider) {
        return matchAnalysisRepository.findByMatchIdAndProvider(matchId, provider);
    }

    @Transactional(readOnly = true)
    public Optional<MatchAnalysis> getSavedAnalysis(Long matchId, AnalysisProvider provider) {
        return matchAnalysisRepository.findByMatchIdAndProvider(matchId, provider);
    }

    public MatchAnalysis generateGeminiAnalysis(Long matchId) {
        Optional<MatchAnalysis> existing = getSavedAnalysis(matchId, AnalysisProvider.GEMINI);
        if (existing.isPresent() && existing.get().getStatus() == AnalysisStatus.DONE) {
            return existing.get();
        }
        return geminiGenerator.generate(matchId, false);
    }

    public MatchAnalysis regenerateGeminiAnalysis(Long matchId) {
        return geminiGenerator.generate(matchId, true);
    }

    @Transactional
    public MatchAnalysis createMockAnalysis(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new BusinessException("경기를 찾을 수 없습니다."));

        MatchAnalysis analysis = matchAnalysisRepository
                .findByMatchIdAndProvider(matchId, AnalysisProvider.MOCK)
                .orElseGet(() -> MatchAnalysis.builder()
                        .match(match)
                        .provider(AnalysisProvider.MOCK)
                        .createdAt(LocalDateTime.now())
                        .build());

        analysis.setStatus(AnalysisStatus.DONE);
        analysis.setSummaryText("[MOCK] " + match.getHomeTeam().getTeamName() + " vs "
                + match.getAwayTeam().getTeamName() + " 경기 요약입니다.");
        analysis.setTacticalAnalysis("[MOCK] 양 팀의 전술 분석 내용입니다.");
        analysis.setKeyPoint("[MOCK] 핵심 포인트 3가지를 정리한 내용입니다.");
        analysis.setErrorMessage(null);
        analysis.setUpdatedAt(LocalDateTime.now());

        return matchAnalysisRepository.save(analysis);
    }
}
