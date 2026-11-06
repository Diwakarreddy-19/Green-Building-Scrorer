package com.greenscore.engine;

import com.greenscore.model.BuildingInput;
import com.greenscore.model.Category;
import com.greenscore.model.RuleResult;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * OOP Polymorphism & Inheritance:
 * Evaluates performance based on discrete tiered bands (e.g. EPI reduction vs benchmark).
 * Matches by tier ID or by finding the highest satisfied numeric threshold.
 */
public class TieredCriterion extends Criterion {

    private final List<Tier> tiers;

    public TieredCriterion(String id,
                           String name,
                           Category category,
                           double maxPoints,
                           List<Tier> tiers,
                           String suggestionText,
                           String inputHint) {
        super(id, name, category, maxPoints, suggestionText, inputHint, CriterionType.TIERED);
        if (tiers == null || tiers.isEmpty()) {
            throw new IllegalArgumentException("TieredCriterion must have at least one Tier");
        }
        // Store tiers defensively
        this.tiers = Collections.unmodifiableList(new ArrayList<>(tiers));
    }

    public List<Tier> getTiers() {
        return tiers;
    }

    @Override
    public List<Map<String, Object>> getTierOptions() {
        List<Map<String, Object>> options = new ArrayList<>();
        for (Tier tier : tiers) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", tier.id());
            map.put("label", tier.label());
            map.put("points", tier.pointsAwarded());
            map.put("description", tier.description());
            options.add(map);
        }
        return options;
    }

    @Override
    public RuleResult evaluate(BuildingInput in) {
        if (in == null) {
            Tier defaultTier = tiers.get(tiers.size() - 1);
            return createResult(defaultTier.pointsAwarded(), defaultTier.id());
        }

        Object raw = in.getValues().get(getId());
        Tier matchedTier = null;

        // 1. Check if raw input matches a tier ID directly (e.g., from UI dropdown)
        if (raw != null) {
            String rawStr = raw.toString().trim();
            for (Tier tier : tiers) {
                if (tier.id().equalsIgnoreCase(rawStr)) {
                    matchedTier = tier;
                    break;
                }
            }
        }

        // 2. If not matched by ID, check if numeric value satisfies threshold
        if (matchedTier == null) {
            double numericVal = in.getNumericValue(getId(), -1.0);
            if (numericVal >= 0.0) {
                // Find highest threshold satisfied
                for (Tier tier : tiers) {
                    if (numericVal >= tier.minThreshold()) {
                        matchedTier = tier;
                        break;
                    }
                }
            }
        }

        // 3. Fallback to lowest tier if no match
        if (matchedTier == null) {
            matchedTier = tiers.get(tiers.size() - 1);
        }

        double earned = Math.max(0.0, Math.min(getMaxPoints(), matchedTier.pointsAwarded()));
        return createResult(earned, matchedTier.id());
    }

    private RuleResult createResult(double earnedPoints, Object inputVal) {
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
                inputVal
        );
    }
}
