# ADR 002: Deterministic nutrition engine

## Decision

Nutrition calculations, daily progress, remaining goals, and meal-plan validation remain pure
TypeScript functions without LLM calls.

## Context

Calories and nutrient totals must be reproducible, testable, and auditable. A generative model is
not an acceptable source of arithmetic or inventory truth.

## Consequences

The same inputs always produce the same totals and validation results. AI can recommend candidates,
but the engine decides whether a recipe or plan satisfies the domain constraints.
