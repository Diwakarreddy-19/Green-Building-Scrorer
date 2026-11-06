package com.greenscore.model;

/**
 * Immutable evaluation result for a single criterion rule.
 * Demonstrates Encapsulation through immutable record semantics.
 */
public record RuleResult(
        String criterionId,
        String criterionName,
        Category category,
        double earnedPoints,
        double maxPoints,
        double compliancePercentage,
        boolean achieved,
        String suggestion,
        double pointsAvailable,
        Object inputValue
) {
    public RuleResult {
        // Round points to 2 decimal places for clean reporting
        earnedPoints = Math.round(earnedPoints * 100.0) / 100.0;
        maxPoints = Math.round(maxPoints * 100.0) / 100.0;
        compliancePercentage = Math.round(compliancePercentage * 10.0) / 10.0;
        pointsAvailable = Math.max(0.0, Math.round((maxPoints - earnedPoints) * 100.0) / 100.0);
    }
}
