package com.greenscore.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class EvaluationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/standards returns supported standards list with HTTP 200")
    void testGetStandards() throws Exception {
        mockMvc.perform(get("/api/standards"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is("GRIHA")))
                .andExpect(jsonPath("$[1].id", is("IGBC")))
                .andExpect(jsonPath("$[0].categoryWeights.ENERGY", is(30.0)))
                .andExpect(jsonPath("$[1].categoryWeights.WATER", is(28.0)));
    }

    @Test
    @DisplayName("GET /api/criteria returns criteria list with HTTP 200")
    void testGetCriteriaSuccess() throws Exception {
        mockMvc.perform(get("/api/criteria")
                        .param("standard", "GRIHA")
                        .param("buildingType", "OFFICE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(16)))
                .andExpect(jsonPath("$[0].id", is("energy_epi")))
                .andExpect(jsonPath("$[0].type", is("TIERED")))
                .andExpect(jsonPath("$[1].id", is("energy_renewable")))
                .andExpect(jsonPath("$[1].type", is("PERCENTAGE")));
    }

    @Test
    @DisplayName("GET /api/criteria returns HTTP 400 when standard is missing")
    void testGetCriteriaMissingStandard() throws Exception {
        mockMvc.perform(get("/api/criteria"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", notNullValue()))
                .andExpect(jsonPath("$.details", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/evaluate returns HTTP 200 with complete ScoreReport for valid request")
    void testEvaluateSuccess() throws Exception {
        String validJson = """
                {
                  "buildingName": "Solaris Innovation Hub",
                  "buildingType": "OFFICE",
                  "standard": "GRIHA",
                  "values": {
                    "energy_epi": "EXCEED_30",
                    "energy_renewable": 25.0,
                    "energy_lighting": 90.0,
                    "energy_passive_hvac": true,
                    "water_rainwater": true,
                    "water_low_flow": 80.0,
                    "water_recycling": 75.0,
                    "water_landscaping": true,
                    "mat_recycled": 25.0,
                    "mat_regional": 60.0,
                    "mat_low_voc": true,
                    "mat_blended_cement": 40.0,
                    "waste_diversion": 70.0,
                    "waste_organic": true,
                    "waste_segregation": true,
                    "waste_hazardous": true
                  }
                }
                """;

        mockMvc.perform(post("/api/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.buildingName", is("Solaris Innovation Hub")))
                .andExpect(jsonPath("$.standard", is("GRIHA")))
                .andExpect(jsonPath("$.totalScore", greaterThan(75.0)))
                .andExpect(jsonPath("$.isReady", is(true)))
                .andExpect(jsonPath("$.readinessStatus", is("Certification Ready")))
                .andExpect(jsonPath("$.categoryScores", hasSize(4)))
                .andExpect(jsonPath("$.ruleResults", hasSize(16)))
                .andExpect(jsonPath("$.suggestions", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/evaluate handles missing values by defaulting to 0/false without error")
    void testEvaluateMissingValuesDefaultToZero() throws Exception {
        String minimalJson = """
                {
                  "buildingName": "Bare Minimum Building",
                  "buildingType": "RESIDENTIAL",
                  "standard": "IGBC",
                  "values": {}
                }
                """;

        mockMvc.perform(post("/api/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(minimalJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalScore", is(0.0)))
                .andExpect(jsonPath("$.isReady", is(false)))
                .andExpect(jsonPath("$.readinessStatus", is("Improvement Required")));
    }

    @Test
    @DisplayName("POST /api/evaluate returns HTTP 400 when building name is blank")
    void testEvaluateBlankBuildingName() throws Exception {
        String invalidJson = """
                {
                  "buildingName": "   ",
                  "buildingType": "OFFICE",
                  "standard": "GRIHA",
                  "values": {}
                }
                """;

        mockMvc.perform(post("/api/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", notNullValue()))
                .andExpect(jsonPath("$.details[0]", containsString("Building name cannot be blank")));
    }

    @Test
    @DisplayName("POST /api/evaluate returns HTTP 400 when standard is unknown")
    void testEvaluateUnknownStandard() throws Exception {
        String invalidJson = """
                {
                  "buildingName": "Valid Name",
                  "buildingType": "OFFICE",
                  "standard": "LEED_INTERNATIONAL",
                  "values": {}
                }
                """;

        mockMvc.perform(post("/api/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", notNullValue()))
                .andExpect(jsonPath("$.details[0]", containsString("Unknown certification standard")));
    }

    @Test
    @DisplayName("POST /api/evaluate returns HTTP 400 when building type is unknown")
    void testEvaluateUnknownBuildingType() throws Exception {
        String invalidJson = """
                {
                  "buildingName": "Valid Name",
                  "buildingType": "SPACE_STATION",
                  "standard": "GRIHA",
                  "values": {}
                }
                """;

        mockMvc.perform(post("/api/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", notNullValue()))
                .andExpect(jsonPath("$.details[0]", containsString("Unknown building type")));
    }

    @Test
    @DisplayName("POST /api/evaluate returns HTTP 400 for negative input numbers")
    void testEvaluateNegativeNumber() throws Exception {
        String invalidJson = """
                {
                  "buildingName": "Valid Name",
                  "buildingType": "OFFICE",
                  "standard": "GRIHA",
                  "values": {
                    "energy_renewable": -15.0
                  }
                }
                """;

        mockMvc.perform(post("/api/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", notNullValue()))
                .andExpect(jsonPath("$.details[0]", containsString("Negative numbers are not allowed")));
    }

    @Test
    @DisplayName("POST /api/evaluate returns HTTP 400 for percentage exceeding 100")
    void testEvaluatePercentageExceeding100() throws Exception {
        String invalidJson = """
                {
                  "buildingName": "Valid Name",
                  "buildingType": "OFFICE",
                  "standard": "GRIHA",
                  "values": {
                    "water_low_flow": 125.0
                  }
                }
                """;

        mockMvc.perform(post("/api/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", notNullValue()))
                .andExpect(jsonPath("$.details[0]", containsString("cannot exceed 100")));
    }

    @Test
    @DisplayName("POST /api/evaluate returns HTTP 400 for malformed JSON without throwing 500")
    void testEvaluateMalformedJson() throws Exception {
        String malformedJson = "{ buildingName: corrupt, ";

        mockMvc.perform(post("/api/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(malformedJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Malformed Request Body")));
    }
}
