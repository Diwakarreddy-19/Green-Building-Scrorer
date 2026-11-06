package com.greenscore.model;

import java.time.Instant;
import java.util.List;

/**
 * Immutable comprehensive evaluation score report.
 * Contains final score, readiness status, category breakdowns, detailed rule results, and ranked suggestions.
 */
public record ScoreReport(
        String buildingName,
        BuildingType buildingType,
        String buildingTypeDisplayName,
        String standard,
        String standardDisplayName,
        double totalScore,
        String readinessStatus,
        boolean isReady,
        String ratingBand,
        String ratingBandDescription,
        List<CategoryScore> categoryScores,
        List<RuleResult> ruleResults,
        List<ImprovementSuggestion> suggestions,
        String evaluationTimestamp
) {
    public ScoreReport {
        totalScore = Math.round(totalScore * 10.0) / 10.0;
        if (evaluationTimestamp == null || evaluationTimestamp.isBlank()) {
            evaluationTimestamp = Instant.now().toString();
        }
    }
}
