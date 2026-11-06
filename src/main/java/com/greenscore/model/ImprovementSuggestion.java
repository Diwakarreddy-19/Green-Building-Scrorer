package com.greenscore.model;

/**
 * Prioritized actionable improvement tip for a criterion that did not receive full marks.
 */
public record ImprovementSuggestion(
        String criterionId,
        String criterionName,
        Category category,
        String categoryName,
        double pointsAvailable,
        double currentEarned,
        double maxPoints,
        String actionTip
) {
    public ImprovementSuggestion {
        pointsAvailable = Math.round(pointsAvailable * 100.0) / 100.0;
        currentEarned = Math.round(currentEarned * 100.0) / 100.0;
        maxPoints = Math.round(maxPoints * 100.0) / 100.0;
    }
}
