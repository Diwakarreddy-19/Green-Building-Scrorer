package com.greenscore.api.dto;

import java.util.List;

/**
 * Standardized error payload matching {error, details} format.
 */
public record ErrorResponseDto(
        String error,
        List<String> details
) {
    public ErrorResponseDto(String error, String detail) {
        this(error, detail != null ? List.of(detail) : List.of());
    }
}
