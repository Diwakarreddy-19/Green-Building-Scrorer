package com.greenscore.engine;

import com.greenscore.model.BuildingInput;
import com.greenscore.model.BuildingType;
import com.greenscore.model.Category;
import com.greenscore.model.RuleResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class TieredCriterionTest {

    private final List<Tier> tiers = List.of(
            new Tier("EXCEED_30", "≥ 30% reduction", 30.0, 10.0, "Tier 1"),
            new Tier("EXCEED_20", "20% - 29.9% reduction", 20.0, 7.0, "Tier 2"),
            new Tier("EXCEED_10", "10% - 19.9% reduction", 10.0, 4.0, "Tier 3"),
            new Tier("BASELINE", "< 10% reduction", 0.0, 0.0, "Tier 4")
    );

    private final TieredCriterion tieredCriterion = new TieredCriterion(
            "energy_epi",
            "Energy Performance Index vs Benchmark",
            Category.ENERGY,
            10.0,
            tiers,
            "Improve thermal envelope and chiller efficiency.",
            "EPI Reduction"
    );

    @Test
    @DisplayName("TieredCriterion evaluates correctly by tier ID string")
    void testEvaluationByTierId() {
        BuildingInput inMax = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("energy_epi", "EXCEED_30"));
        RuleResult resultMax = tieredCriterion.evaluate(inMax);
        assertEquals(10.0, resultMax.earnedPoints(), 0.001);
        assertTrue(resultMax.achieved());
        assertNull(resultMax.suggestion());

        BuildingInput inMid = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("energy_epi", "EXCEED_20"));
        RuleResult resultMid = tieredCriterion.evaluate(inMid);
        assertEquals(7.0, resultMid.earnedPoints(), 0.001);
        assertFalse(resultMid.achieved());
        assertNotNull(resultMid.suggestion());

        BuildingInput inBase = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("energy_epi", "BASELINE"));
        RuleResult resultBase = tieredCriterion.evaluate(inBase);
        assertEquals(0.0, resultBase.earnedPoints(), 0.001);
    }

    @Test
    @DisplayName("TieredCriterion evaluates correctly by numeric reduction percentage")
    void testEvaluationByNumericThreshold() {
        // >= 30%
        BuildingInput in35 = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("energy_epi", 35.0));
        assertEquals(10.0, tieredCriterion.evaluate(in35).earnedPoints(), 0.001);

        // Boundary exactly 30%
        BuildingInput in30 = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("energy_epi", 30.0));
        assertEquals(10.0, tieredCriterion.evaluate(in30).earnedPoints(), 0.001);

        // 25% (falls in 20% - 29.9% tier)
        BuildingInput in25 = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("energy_epi", 25.0));
        assertEquals(7.0, tieredCriterion.evaluate(in25).earnedPoints(), 0.001);

        // 12% (falls in 10% - 19.9% tier)
        BuildingInput in12 = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("energy_epi", 12.0));
        assertEquals(4.0, tieredCriterion.evaluate(in12).earnedPoints(), 0.001);

        // 5% (falls in baseline < 10% tier)
        BuildingInput in5 = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("energy_epi", 5.0));
        assertEquals(0.0, tieredCriterion.evaluate(in5).earnedPoints(), 0.001);
    }

    @Test
    @DisplayName("TieredCriterion falls back to lowest tier for null or missing input")
    void testFallbackForMissingInput() {
        BuildingInput inEmpty = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA", Map.of());
        RuleResult result = tieredCriterion.evaluate(inEmpty);
        assertEquals(0.0, result.earnedPoints(), 0.001);
        assertFalse(result.achieved());
    }
}
