package com.greenscore.model;

/**
 * Immutable aggregated score for an entire sustainability category.
 * Demonstrates Encapsulation and weighted scoring representation.
 */
public record CategoryScore(
        Category category,
        String categoryName,
        double earnedPoints,
        double maxPoints,
        double weight,
        double weightedScore,
        double percentage
) {
    public CategoryScore {
        earnedPoints = Math.round(earnedPoints * 100.0) / 100.0;
        maxPoints = Math.round(maxPoints * 100.0) / 100.0;
        weight = Math.round(weight * 10.0) / 10.0;
        weightedScore = Math.round(weightedScore * 10.0) / 10.0;
        percentage = Math.round(percentage * 10.0) / 10.0;
    }
}
