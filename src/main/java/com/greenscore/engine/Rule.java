package com.greenscore.engine;

import com.greenscore.model.BuildingInput;
import com.greenscore.model.RuleResult;

/**
 * OOP Abstraction:
 * Core interface defining the evaluation contract for sustainability rules.
 * All criteria polymorphically implement this interface.
 */
public interface Rule {

    /**
     * Evaluates building input parameters and produces an immutable RuleResult.
     *
     * @param in the submitted building data
     * @return evaluated score and compliance metrics
     */
    RuleResult evaluate(BuildingInput in);
}
