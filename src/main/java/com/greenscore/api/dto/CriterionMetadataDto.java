package com.greenscore.api.dto;

import java.util.List;
import java.util.Map;

/**
 * DTO providing criterion metadata to dynamically render UI input controls.
 */
public record CriterionMetadataDto(
        String id,
        String name,
        String category,
        String categoryDisplayName,
        String type,
        double maxPoints,
        String inputHint,
        double min,
        double max,
        String unit,
        List<Map<String, Object>> tierOptions,
        Object defaultValue
) {
}
