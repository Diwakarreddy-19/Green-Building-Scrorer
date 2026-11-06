package com.greenscore.engine;

import com.greenscore.model.BuildingInput;
import com.greenscore.model.Category;
import com.greenscore.model.CategoryScore;
import com.greenscore.model.ImprovementSuggestion;
import com.greenscore.model.RuleResult;
import com.greenscore.model.ScoreReport;
import com.greenscore.standard.CertificationStandard;
import com.greenscore.standard.RatingBand;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * OOP Core Engine:
 * Coordinates the evaluation of building data against any CertificationStandard strategy.
 *
 * Demonstrates:
 * - Strategy: Accepts any CertificationStandard dynamically.
 * - Polymorphism: Iterates over List<Criterion> and calls evaluate() polymorphically.
 * - Encapsulation: Produces immutable ScoreReport, CategoryScore, and RuleResult records.
 */
@Service
public class ScoringEngine {

    public static final double READINESS_THRESHOLD = 60.0;

    /**
     * Evaluates a building input against a chosen certification standard.
     *
     * @param input    Building input parameters
     * @param standard Strategy representing the rating standard (e.g. GRIHA or IGBC)
     * @return Complete evaluation score report
     */
    public ScoreReport evaluate(BuildingInput input, CertificationStandard standard) {
        if (input == null) {
            throw new IllegalArgumentException("BuildingInput cannot be null");
        }
        if (standard == null) {
            throw new IllegalArgumentException("CertificationStandard cannot be null");
        }

        // 1. Obtain criteria list from the chosen standard strategy
        List<Criterion> criteria = standard.getCriteria(input.getBuildingType());

        // 2. Polymorphic evaluation of all rules
        List<RuleResult> ruleResults = new ArrayList<>();
        Map<Category, List<RuleResult>> categorizedResults = new EnumMap<>(Category.class);
        for (Category category : Category.values()) {
            categorizedResults.put(category, new ArrayList<>());
        }

        for (Criterion criterion : criteria) {
            // Polymorphic call: executes BooleanCriterion, PercentageCriterion, or TieredCriterion evaluate()
            RuleResult result = criterion.evaluate(input);
            ruleResults.add(result);
            categorizedResults.get(result.category()).add(result);
        }

        // 3. Compute weighted category scores
        List<CategoryScore> categoryScores = new ArrayList<>();
        double totalWeightedScore = 0.0;

        for (Category category : Category.values()) {
            List<RuleResult> resultsForCat = categorizedResults.get(category);
            double earnedSum = 0.0;
            double maxSum = 0.0;

            for (RuleResult rr : resultsForCat) {
                earnedSum += rr.earnedPoints();
                maxSum += rr.maxPoints();
            }

            double categoryWeight = standard.getCategoryWeight(category);
            double weightedScore = maxSum > 0.0 ? (earnedSum / maxSum) * categoryWeight : 0.0;
            double percentage = maxSum > 0.0 ? (earnedSum / maxSum) * 100.0 : 0.0;

            CategoryScore catScore = new CategoryScore(
                    category,
                    category.getDisplayName(),
                    earnedSum,
                    maxSum,
                    categoryWeight,
                    weightedScore,
                    percentage
            );
            categoryScores.add(catScore);
            totalWeightedScore += catScore.weightedScore();
        }

        // 4. Clamped and rounded total score (0.0 to 100.0, rounded to 1 decimal place)
        double roundedTotalScore = Math.round(totalWeightedScore * 10.0) / 10.0;
        double clampedTotal = Math.max(0.0, Math.min(100.0, roundedTotalScore));

        // 5. Readiness determination (Exact threshold: >= 60.0 => Certification Ready, else Improvement Required)
        boolean isReady = clampedTotal >= READINESS_THRESHOLD;
        String readinessStatus = isReady ? "Certification Ready" : "Improvement Required";

        // 6. Rating band resolution from standard strategy
        RatingBand ratingBand = standard.resolveRatingBand(clampedTotal);
        String ratingLabel = ratingBand != null ? ratingBand.label() : "Standard Assessment";
        String ratingDesc = ratingBand != null ? ratingBand.description() : standard.getDisclaimer();

        // 7. Extract and rank improvement suggestions descending by points available
        List<ImprovementSuggestion> suggestions = new ArrayList<>();
        for (RuleResult rr : ruleResults) {
            if (rr.pointsAvailable() > 0.001) {
                String tip = (rr.suggestion() != null && !rr.suggestion().isBlank())
                        ? rr.suggestion()
                        : "Optimize " + rr.criterionName() + " to achieve full certification points.";

                suggestions.add(new ImprovementSuggestion(
                        rr.criterionId(),
                        rr.criterionName(),
                        rr.category(),
                        rr.category().getDisplayName(),
                        rr.pointsAvailable(),
                        rr.earnedPoints(),
                        rr.maxPoints(),
                        tip
                ));
            }
        }

        // Sort descending by points available (highest impact improvement first)
        suggestions.sort(Comparator.comparingDouble(ImprovementSuggestion::pointsAvailable).reversed());

        return new ScoreReport(
                input.getBuildingName(),
                input.getBuildingType(),
                input.getBuildingType() != null ? input.getBuildingType().getDisplayName() : "Unknown Typology",
                standard.getId(),
                standard.getDisplayName(),
                clampedTotal,
                readinessStatus,
                isReady,
                ratingLabel,
                ratingDesc,
                categoryScores,
                ruleResults,
                suggestions,
                Instant.now().toString()
        );
    }
}
