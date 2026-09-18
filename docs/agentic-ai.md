# Agentic AI

Phase 14 adds `MealPlanningAgent`, an orchestration layer that uses the authenticated tools from
Phase 13. It gathers goals, daily progress, pantry inventory, expiring items, and recipe
candidates; an injected planner composes a proposal; meal nutrition is calculated; the proposal is
validated; and only a valid plan is persisted before the shopping list is generated.

The agent does not access the database. It receives a `ToolRegistry` and a typed `composePlan`
function, so the future model integration can be changed without bypassing domain services.

Every run is bounded by `maxSteps`, `maxToolCalls`, `maxRetries`, `timeoutMs`, and `tokenBudget`.
Retries apply only to failed tool calls. Invalid plans stop before `updateMealPlan` and
`generateShoppingList`, and proposals cannot change the requested plan ID.

The default limits are six orchestration steps, ten tool calls, two retries, a ten-second timeout,
and an estimated context budget of 8,000 tokens. These defaults can be overridden per agent
instance, subject to positive-value validation.
