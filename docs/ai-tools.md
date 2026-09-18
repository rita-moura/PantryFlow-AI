# AI Tools

Phase 13 exposes the existing deterministic domain capabilities through a typed tool registry.
The registry currently contains tools for pantry items, expiring stock, nutrition goals and daily
progress, recipe search, meal nutrition, meal-plan validation and updates, substitutions, and
shopping-list generation.

Each tool has a concrete input contract, validates unknown input before execution, requires a
non-empty authenticated `userId`, and delegates to a handler injected by the API layer. Tool
handlers return promises and are intentionally kept outside the AI package so agents cannot access
the database directly. The registry is therefore usable by the future request router and agent
without coupling those components to persistence details.

The current phase defines the contracts and enforcement boundary. Wiring handlers to API services
and exposing them to the agent are Phase 14 work.
