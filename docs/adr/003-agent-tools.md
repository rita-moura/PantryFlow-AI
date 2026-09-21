# ADR 003: Typed tools for agents

## Decision

Agents call typed, schema-validated, authenticated tools injected by the application layer.

## Context

Direct database access would bypass authorization, business invariants, and audit history. The
agent needs capabilities such as pantry lookup, nutrition calculation, plan validation, and
shopping-list generation.

## Consequences

Tool inputs and outputs are testable contracts. Services can evolve independently of the agent,
and every call can be traced and bounded by the orchestration limits.
