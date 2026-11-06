package com.greenscore.standard;

import com.greenscore.engine.Criterion;
import com.greenscore.model.BuildingType;
import com.greenscore.model.Category;

import java.util.List;
import java.util.Map;

/**
 * OOP Strategy Pattern:
 * Defines the contract for certification standards (e.g. GRIHA, IGBC).
 * Provides category weighting strategies, criteria catalogs, and rating bands.
 */
public interface CertificationStandard {

    /**
     * Unique identifier for the standard (e.g., "GRIHA", "IGBC").
     */
    String getId();

    /**
     * Human-readable full title of the standard.
     */
    String getDisplayName();

    /**
     * Summary description of the rating framework.
     */
    String getDescription();

    /**
     * Strategy method returning category weights that must sum to 100.
     */
    Map<Category, Double> getCategoryWeights();

    /**
     * Returns weight for a given category.
     */
    default double getCategoryWeight(Category category) {
        return getCategoryWeights().getOrDefault(category, 0.0);
    }

    /**
     * Strategy method providing the active criteria list, optionally tuned for building typology.
     */
    List<Criterion> getCriteria(BuildingType buildingType);

    /**
     * Returns the illustrative rating bands.
     */
    List<RatingBand> getRatingBands();

    /**
     * Resolves the rating band matching a given total score (0 - 100).
     */
    RatingBand resolveRatingBand(double totalScore);

    /**
     * Disclaimer notice indicating bands are illustrative.
     */
    default String getDisclaimer() {
        return "Illustrative, not official certification.";
    }
}
