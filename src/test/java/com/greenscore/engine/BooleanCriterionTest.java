package com.greenscore.engine;

import com.greenscore.model.BuildingInput;
import com.greenscore.model.BuildingType;
import com.greenscore.model.Category;
import com.greenscore.model.RuleResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class BooleanCriterionTest {

    private final BooleanCriterion criterion = new BooleanCriterion(
            "water_rainwater",
            "Rainwater Harvesting System",
            Category.WATER,
            8.0,
            "Install rainwater harvesting system.",
            "Rooftop runoff collection"
    );

    @Test
    @DisplayName("BooleanCriterion returns full points when true")
    void testFullPointsWhenTrue() {
        BuildingInput in = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("water_rainwater", true));

        RuleResult result = criterion.evaluate(in);

        assertEquals(8.0, result.earnedPoints(), 0.001);
        assertEquals(8.0, result.maxPoints(), 0.001);
        assertEquals(100.0, result.compliancePercentage(), 0.001);
        assertTrue(result.achieved());
        assertNull(result.suggestion());
        assertEquals(0.0, result.pointsAvailable(), 0.001);
    }

    @Test
    @DisplayName("BooleanCriterion returns 0 points and actionable suggestion when false")
    void testZeroPointsWhenFalse() {
        BuildingInput in = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("water_rainwater", false));

        RuleResult result = criterion.evaluate(in);

        assertEquals(0.0, result.earnedPoints(), 0.001);
        assertEquals(8.0, result.maxPoints(), 0.001);
        assertEquals(0.0, result.compliancePercentage(), 0.001);
        assertFalse(result.achieved());
        assertEquals("Install rainwater harvesting system.", result.suggestion());
        assertEquals(8.0, result.pointsAvailable(), 0.001);
    }

    @Test
    @DisplayName("BooleanCriterion returns 0 points when value is missing or null")
    void testZeroPointsWhenMissing() {
        BuildingInput in = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA", Map.of());

        RuleResult result = criterion.evaluate(in);

        assertEquals(0.0, result.earnedPoints(), 0.001);
        assertFalse(result.achieved());
    }

    @Test
    @DisplayName("BooleanCriterion handles string booleans ('true', '1', 'yes')")
    void testStringBooleans() {
        BuildingInput inTrue = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("water_rainwater", "yes"));
        RuleResult resultTrue = criterion.evaluate(inTrue);
        assertEquals(8.0, resultTrue.earnedPoints(), 0.001);

        BuildingInput inFalse = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("water_rainwater", "no"));
        RuleResult resultFalse = criterion.evaluate(inFalse);
        assertEquals(0.0, resultFalse.earnedPoints(), 0.001);
    }
}
