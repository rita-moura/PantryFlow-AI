# ADR 005: Green AI measurements and limits

## Decision

Measure resource use and enforce bounded execution before claiming efficiency improvements.

## Context

AI cost and energy depend on calls, tokens, context size, cache behavior, latency, and agent loops.
Unmeasured savings would be misleading.

## Consequences

The platform records these measurements, routes deterministic work without an LLM, caches
embeddings and external nutrition data, budgets context, and limits agent steps and retries. Any
future reduction claim must compare collected measurements against a baseline.
