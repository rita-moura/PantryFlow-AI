# ADR 004: Deterministic request router

## Decision

Route assistant requests to `CODE`, `RAG`, or `AGENT` with deterministic rules before invoking a
model.

## Context

Questions such as “how much protein is left?” are answered by domain calculations. Retrieval is
needed for grounded recipe knowledge, while multi-step replanning needs tools and an agent.

## Consequences

Simple requests avoid unnecessary model calls and have predictable latency. The route is visible in
traces and can be expanded with tests as new intent patterns are added.
