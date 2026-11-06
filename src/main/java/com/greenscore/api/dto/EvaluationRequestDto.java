package com.greenscore.api.dto;

import java.util.Map;

/**
 * Client submission payload for building assessment.
 */
public record EvaluationRequestDto(
        String buildingName,
        String buildingType,
        String standard,
        Map<String, Object> values
) {
}
