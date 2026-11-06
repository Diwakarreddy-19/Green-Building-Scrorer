package com.greenscore.engine;

/**
 * Representation of a discrete scoring tier/band.
 */
public record Tier(
        String id,
        String label,
        double minThreshold,
        double pointsAwarded,
        String description
) {
}
