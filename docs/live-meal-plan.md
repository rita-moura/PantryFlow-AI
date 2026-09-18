# Live meal plan

Phase 7 adds deterministic replanning for a meal plan after consumption. `replanFutureMeals` uses
`calculateRemainingGoals` and the Phase 6 scorer to choose replacements for future slots. Items with
status `CONSUMED` are returned unchanged and are never candidates for replacement.

The function accepts the current item list, consumed nutrition, goals, available recipes, and pantry
state. It returns the same slot identities with future recipes replaced and marked `REPLACED`. If
there are no future slots, it returns the original list unchanged.

Persistence and HTTP orchestration will be added around this domain behavior as the meal-plan API is
expanded. The core rule is covered by unit tests and has no AI or network dependency.
