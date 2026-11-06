package com.greenscore.engine;

import com.greenscore.model.BuildingInput;
import com.greenscore.model.Category;
import com.greenscore.model.RuleResult;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * OOP Abstraction & Inheritance:
 * Abstract base class representing a certification criterion.
 * Implements Rule interface and provides common fields, encapsulation,
 * and contract for polymorphic evaluation.
 */
public abstract class Criterion implements Rule {

    private final String id;
    private final String name;
    private final Category category;
    private final double maxPoints;
    private final String suggestionText;
    private final String inputHint;
    private final CriterionType type;

    protected Criterion(String id,
                        String name,
                        Category category,
                        double maxPoints,
                        String suggestionText,
                        String inputHint,
                        CriterionType type) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Criterion ID cannot be blank");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Criterion name cannot be blank");
        }
        if (category == null) {
            throw new IllegalArgumentException("Category cannot be null");
        }
        if (maxPoints < 0) {
            throw new IllegalArgumentException("maxPoints cannot be negative");
        }
        this.id = id;
        this.name = name;
        this.category = category;
        this.maxPoints = maxPoints;
        this.suggestionText = suggestionText != null ? suggestionText : "";
        this.inputHint = inputHint != null ? inputHint : "";
        this.type = type;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Category getCategory() {
        return category;
    }

    public double getMaxPoints() {
        return maxPoints;
    }

    public String getSuggestionText() {
        return suggestionText;
    }

    public String getInputHint() {
        return inputHint;
    }

    public CriterionType getType() {
        return type;
    }

    /**
     * Polymorphic evaluation method implemented by subclasses.
     */
    @Override
    public abstract RuleResult evaluate(BuildingInput in);

    /**
     * Optional min value for numeric/percentage criteria (default 0).
     */
    public double getMin() {
        return 0.0;
    }

    /**
     * Optional max value for numeric/percentage criteria (default 100).
     */
    public double getMax() {
        return 100.0;
    }

    /**
     * Optional unit string (e.g. "%", "kWh/m2/yr").
     */
    public String getUnit() {
        return "";
    }

    /**
     * Optional tier options for UI select dropdowns.
     */
    public List<Map<String, Object>> getTierOptions() {
        return Collections.emptyList();
    }
}
