package com.greenscore.engine;

import com.greenscore.model.BuildingInput;
import com.greenscore.model.BuildingType;
import com.greenscore.model.ImprovementSuggestion;
import com.greenscore.model.ScoreReport;
import com.greenscore.standard.GrihaStandard;
import com.greenscore.standard.IgbcStandard;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ScoringEngineTest {

    private final ScoringEngine engine = new ScoringEngine();
    private final GrihaStandard griha = new GrihaStandard();
    private final IgbcStandard igbc = new IgbcStandard();

    @Test
    @DisplayName("All-zero input yields exactly 0.0 points and 'Improvement Required' status")
    void testAllZeroInputYieldsZeroPoints() {
        BuildingInput in = new BuildingInput(
                "Zero Energy Building",
                BuildingType.OFFICE,
                "GRIHA",
                Map.of() // empty map defaults to 0 and false for all criteria
        );

        ScoreReport report = engine.evaluate(in, griha);

        assertEquals(0.0, report.totalScore(), 0.001);
        assertFalse(report.isReady());
        assertEquals("Improvement Required", report.readinessStatus());
        assertEquals("Uncertified", report.ratingBand());
        assertEquals(4, report.categoryScores().size());

        for (var catScore : report.categoryScores()) {
            assertEquals(0.0, catScore.earnedPoints(), 0.001);
            assertEquals(0.0, catScore.weightedScore(), 0.001);
            assertEquals(0.0, catScore.percentage(), 0.001);
        }

        // All 16 criteria should have suggestions since none achieved full points
        assertEquals(16, report.suggestions().size());
    }

    @Test
    @DisplayName("All-perfect input yields exactly 100.0 points and 'Certification Ready' status for GRIHA")
    void testAllPerfectInputYieldsHundredPointsGriha() {
        Map<String, Object> perfectValues = getPerfectValues();
        BuildingInput in = new BuildingInput(
                "Eco Tower Prime",
                BuildingType.OFFICE,
                "GRIHA",
                perfectValues
        );

        ScoreReport report = engine.evaluate(in, griha);

        assertEquals(100.0, report.totalScore(), 0.001);
        assertTrue(report.isReady());
        assertEquals("Certification Ready", report.readinessStatus());
        assertEquals("5 Star (GRIHA)", report.ratingBand());
        assertTrue(report.suggestions().isEmpty(), "Perfect score should generate 0 suggestions");

        for (var catScore : report.categoryScores()) {
            assertEquals(catScore.maxPoints(), catScore.earnedPoints(), 0.001);
            assertEquals(catScore.weight(), catScore.weightedScore(), 0.001);
            assertEquals(100.0, catScore.percentage(), 0.001);
        }
    }

    @Test
    @DisplayName("All-perfect input yields exactly 100.0 points and 'Platinum' status for IGBC")
    void testAllPerfectInputYieldsHundredPointsIgbc() {
        Map<String, Object> perfectValues = getPerfectValues();
        BuildingInput in = new BuildingInput(
                "Eco Tower IGBC",
                BuildingType.OFFICE,
                "IGBC",
                perfectValues
        );

        ScoreReport report = engine.evaluate(in, igbc);

        assertEquals(100.0, report.totalScore(), 0.001);
        assertTrue(report.isReady());
        assertEquals("Certification Ready", report.readinessStatus());
        assertEquals("Platinum (IGBC)", report.ratingBand());
        assertTrue(report.suggestions().isEmpty());
    }

    @Test
    @DisplayName("Exact readiness boundary test: 59.9 is NOT ready, 60.0 IS ready")
    void testReadinessBoundary59Point9Vs60Point0() {
        // Construct building input achieving exactly 59.9 points under GRIHA:
        // Energy = 30.0 (full)
        // Water = 25.0 (full)
        // Subtotal = 55.0
        // Materials: mat_recycled = 21.0% (target 30%, max 7.0) -> (21/30) * 7.0 = 4.9 points
        // Total = 55.0 + 4.9 = 59.9 points!
        Map<String, Object> values59Point9 = new HashMap<>();
        // Energy (30)
        values59Point9.put("energy_epi", "EXCEED_30"); // 10
        values59Point9.put("energy_renewable", 30.0);   // 8
        values59Point9.put("energy_lighting", 100.0);   // 6
        values59Point9.put("energy_passive_hvac", true); // 6
        // Water (25)
        values59Point9.put("water_rainwater", true);    // 8
        values59Point9.put("water_low_flow", 100.0);    // 7
        values59Point9.put("water_recycling", 100.0);   // 6
        values59Point9.put("water_landscaping", true);  // 4
        // Materials (4.9 out of 25)
        values59Point9.put("mat_recycled", 21.0);       // 4.9 points
        // Waste = 0

        BuildingInput in59Point9 = new BuildingInput("Boundary 59.9", BuildingType.OFFICE, "GRIHA", values59Point9);
        ScoreReport report59Point9 = engine.evaluate(in59Point9, griha);

        assertEquals(59.9, report59Point9.totalScore(), 0.001);
        assertFalse(report59Point9.isReady(), "59.9 must NOT be certification ready");
        assertEquals("Improvement Required", report59Point9.readinessStatus());

        // Now construct 60.0 points:
        // Energy (30) + Water (25) + Materials (mat_low_voc = true => 5.0) = exactly 60.0 points!
        Map<String, Object> values60Point0 = new HashMap<>();
        // Energy (30)
        values60Point0.put("energy_epi", "EXCEED_30"); // 10
        values60Point0.put("energy_renewable", 30.0);   // 8
        values60Point0.put("energy_lighting", 100.0);   // 6
        values60Point0.put("energy_passive_hvac", true); // 6
        // Water (25)
        values60Point0.put("water_rainwater", true);    // 8
        values60Point0.put("water_low_flow", 100.0);    // 7
        values60Point0.put("water_recycling", 100.0);   // 6
        values60Point0.put("water_landscaping", true);  // 4
        // Materials (5.0)
        values60Point0.put("mat_low_voc", true);        // 5.0 points
        // Waste = 0

        BuildingInput in60Point0 = new BuildingInput("Boundary 60.0", BuildingType.OFFICE, "GRIHA", values60Point0);
        ScoreReport report60Point0 = engine.evaluate(in60Point0, griha);

        assertEquals(60.0, report60Point0.totalScore(), 0.001);
        assertTrue(report60Point0.isReady(), "60.0 MUST be certification ready");
        assertEquals("Certification Ready", report60Point0.readinessStatus());
    }

    @Test
    @DisplayName("Suggestions are generated for incomplete criteria and sorted descending by points available")
    void testSuggestionsOrdering() {
        Map<String, Object> partialValues = new HashMap<>();
        // Give partial points
        partialValues.put("energy_epi", "EXCEED_20"); // 7 pts earned, 3 pts available
        partialValues.put("water_rainwater", false);   // 0 pts earned, 8 pts available
        partialValues.put("mat_low_voc", false);       // 0 pts earned, 5 pts available

        BuildingInput in = new BuildingInput("Partial Building", BuildingType.OFFICE, "GRIHA", partialValues);
        ScoreReport report = engine.evaluate(in, griha);

        assertFalse(report.suggestions().isEmpty());

        // Verify descending order of pointsAvailable
        double previousAvailable = Double.MAX_VALUE;
        for (ImprovementSuggestion suggestion : report.suggestions()) {
            assertTrue(suggestion.pointsAvailable() <= previousAvailable,
                    "Suggestions must be sorted descending by points available");
            previousAvailable = suggestion.pointsAvailable();
        }
    }

    private Map<String, Object> getPerfectValues() {
        Map<String, Object> map = new HashMap<>();
        // Energy
        map.put("energy_epi", "EXCEED_30");
        map.put("energy_renewable", 30.0);
        map.put("energy_lighting", 100.0);
        map.put("energy_passive_hvac", true);
        // Water
        map.put("water_rainwater", true);
        map.put("water_low_flow", 100.0);
        map.put("water_recycling", 100.0);
        map.put("water_landscaping", true);
        // Materials
        map.put("mat_recycled", 30.0);
        map.put("mat_regional", 70.0);
        map.put("mat_low_voc", true);
        map.put("mat_blended_cement", 50.0);
        // Waste
        map.put("waste_diversion", 75.0);
        map.put("waste_organic", true);
        map.put("waste_segregation", true);
        map.put("waste_hazardous", true);
        return map;
    }
}
