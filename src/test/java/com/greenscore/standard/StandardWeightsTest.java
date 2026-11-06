package com.greenscore.standard;

import com.greenscore.engine.Criterion;
import com.greenscore.model.BuildingType;
import com.greenscore.model.Category;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class StandardWeightsTest {

    private final GrihaStandard griha = new GrihaStandard();
    private final IgbcStandard igbc = new IgbcStandard();

    @Test
    @DisplayName("GRIHA category weights must sum to exactly 100.0")
    void testGrihaWeightsSumTo100() {
        Map<Category, Double> weights = griha.getCategoryWeights();
        double sum = weights.values().stream().mapToDouble(Double::doubleValue).sum();
        assertEquals(100.0, sum, 0.0001, "GRIHA category weights must sum to exactly 100");

        // Specific category weights verification
        assertEquals(30.0, weights.get(Category.ENERGY), 0.001);
        assertEquals(25.0, weights.get(Category.WATER), 0.001);
        assertEquals(25.0, weights.get(Category.MATERIALS), 0.001);
        assertEquals(20.0, weights.get(Category.WASTE), 0.001);
    }

    @Test
    @DisplayName("IGBC category weights must sum to exactly 100.0")
    void testIgbcWeightsSumTo100() {
        Map<Category, Double> weights = igbc.getCategoryWeights();
        double sum = weights.values().stream().mapToDouble(Double::doubleValue).sum();
        assertEquals(100.0, sum, 0.0001, "IGBC category weights must sum to exactly 100");

        // Specific category weights verification (emphasizing water and materials)
        assertEquals(26.0, weights.get(Category.ENERGY), 0.001);
        assertEquals(28.0, weights.get(Category.WATER), 0.001);
        assertEquals(28.0, weights.get(Category.MATERIALS), 0.001);
        assertEquals(18.0, weights.get(Category.WASTE), 0.001);
    }

    @Test
    @DisplayName("GRIHA criteria max points per category must match category weights")
    void testGrihaCriteriaMaxPointsMatchCategoryWeights() {
        for (BuildingType type : BuildingType.values()) {
            List<Criterion> criteria = griha.getCriteria(type);
            double totalMax = criteria.stream().mapToDouble(Criterion::getMaxPoints).sum();
            assertEquals(100.0, totalMax, 0.0001, "GRIHA criteria max points must sum to 100 for " + type);

            for (Category category : Category.values()) {
                double catMax = criteria.stream()
                        .filter(c -> c.getCategory() == category)
                        .mapToDouble(Criterion::getMaxPoints)
                        .sum();
                assertEquals(griha.getCategoryWeight(category), catMax, 0.0001,
                        "Category " + category + " criteria sum must match weight in GRIHA for " + type);
            }
        }
    }

    @Test
    @DisplayName("IGBC criteria max points per category must match category weights")
    void testIgbcCriteriaMaxPointsMatchCategoryWeights() {
        for (BuildingType type : BuildingType.values()) {
            List<Criterion> criteria = igbc.getCriteria(type);
            double totalMax = criteria.stream().mapToDouble(Criterion::getMaxPoints).sum();
            assertEquals(100.0, totalMax, 0.0001, "IGBC criteria max points must sum to 100 for " + type);

            for (Category category : Category.values()) {
                double catMax = criteria.stream()
                        .filter(c -> c.getCategory() == category)
                        .mapToDouble(Criterion::getMaxPoints)
                        .sum();
                assertEquals(igbc.getCategoryWeight(category), catMax, 0.0001,
                        "Category " + category + " criteria sum must match weight in IGBC for " + type);
            }
        }
    }

    @Test
    @DisplayName("Rating bands must include illustrative disclaimer")
    void testRatingBandsDisclaimer() {
        assertTrue(griha.getDisclaimer().toLowerCase().contains("illustrative"));
        assertTrue(igbc.getDisclaimer().toLowerCase().contains("illustrative"));

        for (RatingBand band : griha.getRatingBands()) {
            assertTrue(band.description().toLowerCase().contains("illustrative"));
        }
        for (RatingBand band : igbc.getRatingBands()) {
            assertTrue(band.description().toLowerCase().contains("illustrative"));
        }
    }
}
