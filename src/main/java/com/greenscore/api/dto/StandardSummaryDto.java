package com.greenscore.api.dto;

import java.util.Map;

/**
 * DTO summarizing a certification standard.
 */
public record StandardSummaryDto(
        String id,
        String displayName,
        String description,
        Map<String, Double> categoryWeights,
        String disclaimer
) {
}
