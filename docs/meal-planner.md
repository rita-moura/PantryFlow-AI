# Deterministic meal planner

Phase 6 adds a pure deterministic planner to the Nutrition Engine. It scores recipe candidates using
nutrition fit, pantry coverage, expiration urgency, preference score, and preparation time. Candidates
are sorted by score with a recipe ID tie-breaker so the same inputs always produce the same plan.

`createDeterministicMealPlan` selects the requested number of top candidates and validates the combined
nutrition with the existing `validateMealPlan` rules. The planner has no database, network, prompt, or
LLM dependency; callers provide recipes, pantry quantities, goals, and optional weights explicitly.

The planner is intentionally a domain function in `packages/nutrition-engine`. API persistence and
meal-plan lifecycle behavior will be added in the following live meal-plan phase after this scoring
behavior is established and tested.
