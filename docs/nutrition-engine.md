# Deterministic Nutrition Engine

The Nutrition Engine is a pure TypeScript package with no database, HTTP, or AI dependency. It is
the authority for food scaling, recipe and meal totals, daily progress, remaining goals, and
meal-plan nutrition validation.

## Rules

- Nutrition facts are calculated from a declared quantity and unit basis.
- Values must be finite and non-negative; goals and serving counts must be greater than zero.
- Results are rounded to three decimal places and never mutate caller-owned data.
- Mass converts only to mass, volume only to volume, and discrete units only to their own kind.
- Mass-to-volume conversion is rejected because it would require food-specific density.
- Remaining goals are signed: a negative result explicitly represents an exceeded target.
- Optional goals remain absent when the user did not configure them.

## Supported units

Mass: `mg`, `g`, `kg`, `oz`, `lb`. Volume: `ml`, `l`, `tsp`, `tbsp`, `cup`. Discrete quantities:
`unit` and `serving`. Common English aliases are normalized before conversion.

## Meal-plan validation

Default tolerances accept calories between 90–110% of target, require at least 90% of protein and
fiber targets, and cap configured carbohydrate and fat targets at 110%. Callers may override these
ratios explicitly. Validation returns typed violations rather than a prose judgment.

No prompt or LLM participates in any calculation.
