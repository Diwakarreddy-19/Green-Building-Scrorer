package com.greenscore.api;

import com.greenscore.api.dto.CriterionMetadataDto;
import com.greenscore.api.dto.EvaluationRequestDto;
import com.greenscore.api.dto.StandardSummaryDto;
import com.greenscore.engine.Criterion;
import com.greenscore.engine.CriterionType;
import com.greenscore.engine.ScoringEngine;
import com.greenscore.model.BuildingInput;
import com.greenscore.model.BuildingType;
import com.greenscore.model.Category;
import com.greenscore.model.ScoreReport;
import com.greenscore.standard.CertificationStandard;
import com.greenscore.standard.StandardRegistry;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * REST Controller exposing certification standards, criteria discovery, and evaluation engine.
 */
@RestController
@RequestMapping("/api")
public class EvaluationController {

    private final StandardRegistry standardRegistry;
    private final ScoringEngine scoringEngine;

    public EvaluationController(StandardRegistry standardRegistry, ScoringEngine scoringEngine) {
        this.standardRegistry = standardRegistry;
        this.scoringEngine = scoringEngine;
    }

    /**
     * GET /api/standards
     * Returns list of supported certification standards with their weights and descriptions.
     */
    @GetMapping("/standards")
    public ResponseEntity<List<StandardSummaryDto>> getStandards() {
        List<StandardSummaryDto> list = new ArrayList<>();
        for (CertificationStandard standard : standardRegistry.getAllStandards()) {
            Map<String, Double> weights = new LinkedHashMap<>();
            for (Map.Entry<Category, Double> entry : standard.getCategoryWeights().entrySet()) {
                weights.put(entry.getKey().name(), entry.getValue());
            }
            list.add(new StandardSummaryDto(
                    standard.getId(),
                    standard.getDisplayName(),
                    standard.getDescription(),
                    weights,
                    standard.getDisclaimer()
            ));
        }
        return ResponseEntity.ok(list);
    }

    /**
     * GET /api/criteria?standard=GRIHA&buildingType=OFFICE
     * Dynamic criteria discovery returning metadata needed to generate UI forms.
     */
    @GetMapping("/criteria")
    public ResponseEntity<List<CriterionMetadataDto>> getCriteria(
            @RequestParam(name = "standard", required = false) String standardParam,
            @RequestParam(name = "buildingType", required = false) String buildingTypeParam) {

        if (standardParam == null || standardParam.isBlank()) {
            throw new IllegalArgumentException("Query parameter 'standard' is required. Supported: "
                    + standardRegistry.getAvailableStandardIds());
        }

        CertificationStandard standard = standardRegistry.findStandard(standardParam)
                .orElseThrow(() -> new IllegalArgumentException("Unknown standard '" + standardParam
                        + "'. Supported: " + standardRegistry.getAvailableStandardIds()));

        BuildingType type = BuildingType.OFFICE;
        if (buildingTypeParam != null && !buildingTypeParam.isBlank()) {
            try {
                type = BuildingType.valueOf(buildingTypeParam.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                String allowed = Arrays.stream(BuildingType.values())
                        .map(Enum::name)
                        .collect(Collectors.joining(", "));
                throw new IllegalArgumentException("Unknown building type '" + buildingTypeParam
                        + "'. Supported: [" + allowed + "]");
            }
        }

        List<Criterion> criteria = standard.getCriteria(type);
        List<CriterionMetadataDto> dtos = new ArrayList<>();

        for (Criterion c : criteria) {
            Object defVal = switch (c.getType()) {
                case BOOLEAN -> false;
                case PERCENTAGE -> 0.0;
                case TIERED -> (!c.getTierOptions().isEmpty())
                        ? c.getTierOptions().get(c.getTierOptions().size() - 1).get("id")
                        : "BASELINE";
            };

            dtos.add(new CriterionMetadataDto(
                    c.getId(),
                    c.getName(),
                    c.getCategory().name(),
                    c.getCategory().getDisplayName(),
                    c.getType().name(),
                    c.getMaxPoints(),
                    c.getInputHint(),
                    c.getMin(),
                    c.getMax(),
                    c.getUnit(),
                    c.getTierOptions(),
                    defVal
            ));
        }

        return ResponseEntity.ok(dtos);
    }

    /**
     * POST /api/evaluate
     * Evaluates a building submission against a standard and produces a detailed ScoreReport.
     */
    @PostMapping("/evaluate")
    public ResponseEntity<ScoreReport> evaluate(@RequestBody EvaluationRequestDto request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body cannot be null");
        }

        // 1. Validate building name
        if (request.buildingName() == null || request.buildingName().trim().isBlank()) {
            throw new IllegalArgumentException("Building name cannot be blank");
        }

        // 2. Validate building type
        if (request.buildingType() == null || request.buildingType().trim().isBlank()) {
            throw new IllegalArgumentException("Building type is required");
        }
        BuildingType buildingType;
        try {
            buildingType = BuildingType.valueOf(request.buildingType().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            String allowed = Arrays.stream(BuildingType.values())
                    .map(Enum::name)
                    .collect(Collectors.joining(", "));
            throw new IllegalArgumentException("Unknown building type '" + request.buildingType()
                    + "'. Supported: [" + allowed + "]");
        }

        // 3. Validate standard
        if (request.standard() == null || request.standard().trim().isBlank()) {
            throw new IllegalArgumentException("Certification standard is required");
        }
        CertificationStandard standard = standardRegistry.findStandard(request.standard())
                .orElseThrow(() -> new IllegalArgumentException("Unknown certification standard '"
                        + request.standard() + "'. Supported: " + standardRegistry.getAvailableStandardIds()));

        // 4. Validate input values
        Map<String, Object> rawValues = request.values() != null ? request.values() : new HashMap<>();
        List<Criterion> standardCriteria = standard.getCriteria(buildingType);
        Map<String, Criterion> criteriaMap = standardCriteria.stream()
                .collect(Collectors.toMap(Criterion::getId, c -> c));

        for (Map.Entry<String, Object> entry : rawValues.entrySet()) {
            String key = entry.getKey();
            Object val = entry.getValue();
            if (val == null) {
                continue;
            }

            // Check numeric bounds
            if (val instanceof Number num) {
                double d = num.doubleValue();
                if (d < 0.0) {
                    throw new IllegalArgumentException("Negative numbers are not allowed for '" + key + "': " + d);
                }
                Criterion criterion = criteriaMap.get(key);
                if (criterion != null && criterion.getType() == CriterionType.PERCENTAGE) {
                    if (d > 100.0) {
                        throw new IllegalArgumentException("Percentage for '" + key + "' cannot exceed 100: " + d);
                    }
                }
            } else if (val instanceof String s) {
                String str = s.trim();
                try {
                    double d = Double.parseDouble(str);
                    if (d < 0.0) {
                        throw new IllegalArgumentException("Negative numbers are not allowed for '" + key + "': " + d);
                    }
                    Criterion criterion = criteriaMap.get(key);
                    if (criterion != null && criterion.getType() == CriterionType.PERCENTAGE) {
                        if (d > 100.0) {
                            throw new IllegalArgumentException("Percentage for '" + key + "' cannot exceed 100: " + d);
                        }
                    }
                } catch (NumberFormatException ignored) {
                    // It's a non-numeric string (e.g., tier ID or boolean), allowed
                }
            }
        }

        // Missing criterion values default to 0 / false via BuildingInput
        BuildingInput input = new BuildingInput(
                request.buildingName(),
                buildingType,
                standard.getId(),
                rawValues
        );

        ScoreReport report = scoringEngine.evaluate(input, standard);
        return ResponseEntity.ok(report);
    }
}
