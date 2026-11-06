package com.greenscore.model;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Encapsulates client submission data for evaluation.
 * Follows encapsulation principles with defensive copying and safe accessors.
 */
public class BuildingInput {

    private final String buildingName;
    private final BuildingType buildingType;
    private final String standard;
    private final Map<String, Object> values;

    public BuildingInput(String buildingName, BuildingType buildingType, String standard, Map<String, Object> values) {
        this.buildingName = buildingName != null ? buildingName.trim() : "";
        this.buildingType = buildingType;
        this.standard = standard != null ? standard.trim().toUpperCase() : "";
        this.values = values != null ? new HashMap<>(values) : new HashMap<>();
    }

    public String getBuildingName() {
        return buildingName;
    }

    public BuildingType getBuildingType() {
        return buildingType;
    }

    public String getStandard() {
        return standard;
    }

    public Map<String, Object> getValues() {
        return Collections.unmodifiableMap(values);
    }

    /**
     * Safely reads a numeric input value, converting from Double, Integer, or numeric String.
     */
    public double getNumericValue(String key, double defaultValue) {
        Object raw = values.get(key);
        if (raw == null) {
            return defaultValue;
        }
        if (raw instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.parseDouble(raw.toString().trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    /**
     * Safely reads a boolean input value, converting from Boolean or String ("true"/"false", "1"/"0").
     */
    public boolean getBooleanValue(String key, boolean defaultValue) {
        Object raw = values.get(key);
        if (raw == null) {
            return defaultValue;
        }
        if (raw instanceof Boolean bool) {
            return bool;
        }
        String str = raw.toString().trim().toLowerCase();
        if ("true".equals(str) || "1".equals(str) || "yes".equals(str)) {
            return true;
        }
        if ("false".equals(str) || "0".equals(str) || "no".equals(str)) {
            return false;
        }
        return defaultValue;
    }

    /**
     * Safely reads a string value.
     */
    public String getStringValue(String key, String defaultValue) {
        Object raw = values.get(key);
        if (raw == null) {
            return defaultValue;
        }
        return raw.toString().trim();
    }
}
