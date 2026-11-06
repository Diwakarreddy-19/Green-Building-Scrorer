package com.greenscore.engine;

import com.greenscore.model.BuildingInput;
import com.greenscore.model.Category;
import com.greenscore.model.RuleResult;

/**
 * OOP Polymorphism & Inheritance:
 * Evaluates binary compliance (Yes/No or True/False).
 * Awards full points when compliant, zero points when non-compliant.
 */
public class BooleanCriterion extends Criterion {

    public BooleanCriterion(String id,
                            String name,
                            Category category,
                            double maxPoints,
                            String suggestionText,
                            String inputHint) {
        super(id, name, category, maxPoints, suggestionText, inputHint, CriterionType.BOOLEAN);
    }

    @Override
    public RuleResult evaluate(BuildingInput in) {
        boolean compliant = in != null && in.getBooleanValue(getId(), false);
        double earnedPoints = compliant ? getMaxPoints() : 0.0;
        double compliancePercentage = compliant ? 100.0 : 0.0;
        String suggestion = compliant ? null : getSuggestionText();

        return new RuleResult(
                getId(),
                getName(),
                getCategory(),
                earnedPoints,
                getMaxPoints(),
                compliancePercentage,
                compliant,
                suggestion,
                getMaxPoints() - earnedPoints,
                compliant
        );
    }
}
