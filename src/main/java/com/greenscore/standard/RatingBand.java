package com.greenscore.standard;

/**
 * Representation of an illustrative certification rating band/tier.
 */
public record RatingBand(
        String id,
        String label,
        double minScore,
        double maxScore,
        String description
) {
    public boolean contains(double score) {
        return score >= minScore && score <= maxScore;
    }
}
