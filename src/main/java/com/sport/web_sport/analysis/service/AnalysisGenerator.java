package com.sport.web_sport.analysis.service;

import com.sport.web_sport.analysis.entity.MatchAnalysis;

public interface AnalysisGenerator {
    MatchAnalysis generate(Long matchId, boolean forceRegenerate);
}
