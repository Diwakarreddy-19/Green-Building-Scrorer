package com.greenscore.engine;

import com.greenscore.model.BuildingInput;
import com.greenscore.model.BuildingType;
import com.greenscore.model.Category;
import com.greenscore.model.RuleResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class PercentageCriterionTest {

    // 0 to 100% scale (e.g. Low flow fixtures, 7 points)
    private final PercentageCriterion standardPercentageCriterion = new PercentageCriterion(
            "water_low_flow",
            "Low-Flow Plumbing Fixtures",
            Category.WATER,
            7.0,
            0.0,
            100.0,
            "Upgrade to aerated low-flow fixtures.",
            "Percentage of low flow fittings"
    );

    // 0 to 30% target scale (e.g. Renewable energy, 8 points, target 30%)
    private final PercentageCriterion targetedPercentageCriterion = new PercentageCriterion(
            "energy_renewable",
            "Renewable Energy Share",
            Category.ENERGY,
            8.0,
            0.0,
            30.0,
            "Increase rooftop solar installation.",
            "Percentage of energy demand from renewables"
    );

    @Test
    @DisplayName("PercentageCriterion returns zero points for 0% input")
    void testZeroInput() {
        BuildingInput in = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("water_low_flow", 0.0));

        RuleResult result = standardPercentageCriterion.evaluate(in);

        assertEquals(0.0, result.earnedPoints(), 0.001);
        assertEquals(7.0, result.maxPoints(), 0.001);
        assertEquals(0.0, result.compliancePercentage(), 0.001);
        assertFalse(result.achieved());
        assertNotNull(result.suggestion());
    }

    @Test
    @DisplayName("PercentageCriterion performs linear interpolation for partial input")
    void testPartialInputLinearInterpolation() {
        // 50% of 100% target -> 50% of 7 points = 3.5 points
        BuildingInput in50 = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("water_low_flow", 50.0));
        RuleResult result50 = standardPercentageCriterion.evaluate(in50);
        assertEquals(3.5, result50.earnedPoints(), 0.01);
        assertEquals(50.0, result50.compliancePercentage(), 0.1);
        assertFalse(result50.achieved());
        assertNotNull(result50.suggestion());

        // For targeted criterion: 15% out of 30% target -> 50% of 8 points = 4.0 points
        BuildingInput in15 = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("energy_renewable", 15.0));
        RuleResult result15 = targetedPercentageCriterion.evaluate(in15);
        assertEquals(4.0, result15.earnedPoints(), 0.01);
        assertEquals(50.0, result15.compliancePercentage(), 0.1);
    }

    @Test
    @DisplayName("PercentageCriterion returns full points when input meets or exceeds target")
    void testFullInputTargetReached() {
        // Exactly target 100%
        BuildingInput in100 = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("water_low_flow", 100.0));
        RuleResult result100 = standardPercentageCriterion.evaluate(in100);
        assertEquals(7.0, result100.earnedPoints(), 0.001);
        assertEquals(100.0, result100.compliancePercentage(), 0.001);
        assertTrue(result100.achieved());
        assertNull(result100.suggestion());

        // Targeted criterion: 30% meets target of 30% -> full 8.0 points
        BuildingInput in30 = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("energy_renewable", 30.0));
        RuleResult result30 = targetedPercentageCriterion.evaluate(in30);
        assertEquals(8.0, result30.earnedPoints(), 0.001);
        assertTrue(result30.achieved());

        // Exceeding target (e.g. 50% when target is 30%) clamps to maxPoints (8.0)
        BuildingInput in50 = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("energy_renewable", 50.0));
        RuleResult resultExceed = targetedPercentageCriterion.evaluate(in50);
        assertEquals(8.0, resultExceed.earnedPoints(), 0.001);
        assertTrue(resultExceed.achieved());
    }

    @Test
    @DisplayName("PercentageCriterion clamps boundary conditions safely")
    void testBoundaryConditions() {
        // Negative input clamps to 0.0
        BuildingInput inNeg = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("water_low_flow", -20.0));
        RuleResult resultNeg = standardPercentageCriterion.evaluate(inNeg);
        assertEquals(0.0, resultNeg.earnedPoints(), 0.001);

        // > 100 input clamps to 100% maxPoints
        BuildingInput inOver = new BuildingInput("Test", BuildingType.OFFICE, "GRIHA",
                Map.of("water_low_flow", 150.0));
        RuleResult resultOver = standardPercentageCriterion.evaluate(inOver);
        assertEquals(7.0, resultOver.earnedPoints(), 0.001);
    }
}
