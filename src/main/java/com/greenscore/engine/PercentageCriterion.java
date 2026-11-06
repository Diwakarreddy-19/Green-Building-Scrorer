package com.greenscore.engine;

import com.greenscore.model.BuildingInput;
import com.greenscore.model.Category;
import com.greenscore.model.RuleResult;

/**
 * OOP Polymorphism & Inheritance:
 * Evaluates continuous percentage metrics with linear interpolation between a minimum threshold
 * and a target value. Clamps earned points strictly between 0 and maxPoints.
 */
public class PercentageCriterion extends Criterion {

    private final double minValue;
    private final double targetValue;

    public PercentageCriterion(String id,
                               String name,
                               Category category,
                               double maxPoints,
                               double minValue,
                               double targetValue,
                               String suggestionText,
                               String inputHint) {
        super(id, name, category, maxPoints, suggestionText, inputHint, CriterionType.PERCENTAGE);
        if (targetValue <= minValue) {
            throw new IllegalArgumentException("targetValue must be strictly greater than minValue");
        }
        this.minValue = minValue;
        this.targetValue = targetValue;
    }

    public PercentageCriterion(String id,
                               String name,
                               Category category,
                               double maxPoints,
                               double targetValue,
                               String suggestionText,
                               String inputHint) {
        this(id, name, category, maxPoints, 0.0, targetValue, suggestionText, inputHint);
    }

    public double getMinValue() {
        return minValue;
    }

    public double getTargetValue() {
        return targetValue;
    }

    @Override
    public double getMin() {
        return 0.0;
    }

    @Override
    public double getMax() {
        return 100.0;
    }

    @Override
    public String getUnit() {
        return "%";
    }

    @Override
    public RuleResult evaluate(BuildingInput in) {
        double rawValue = in != null ? in.getNumericValue(getId(), 0.0) : 0.0;
        // Clamp raw input between 0 and 100 for safety
        double clampedInput = Math.max(0.0, Math.min(100.0, rawValue));

        double earnedPoints;
        if (clampedInput <= minValue) {
            earnedPoints = 0.0;
        } else if (clampedInput >= targetValue) {
            earnedPoints = getMaxPoints();
        } else {
            double ratio = (clampedInput - minValue) / (targetValue - minValue);
            earnedPoints = getMaxPoints() * ratio;
        }

        // Clamp earned points to [0, maxPoints]
        earnedPoints = Math.max(0.0, Math.min(getMaxPoints(), earnedPoints));
        double compliancePercentage = getMaxPoints() > 0 ? (earnedPoints / getMaxPoints()) * 100.0 : 0.0;
        boolean achieved = earnedPoints >= getMaxPoints();
        String suggestion = achieved ? null : getSuggestionText();

        return new RuleResult(
                getId(),
                getName(),
                getCategory(),
                earnedPoints,
                getMaxPoints(),
                compliancePercentage,
                achieved,
                suggestion,
                getMaxPoints() - earnedPoints,
                clampedInput
        );
    }
}
