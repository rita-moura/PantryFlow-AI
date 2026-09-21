# ADR 001: PostgreSQL and pgvector

## Decision

Use PostgreSQL as the system of record and pgvector for recipe and knowledge embeddings.

## Context

Pantry, nutrition, recipes, meal plans, consumption, and shopping lists need transactions,
foreign keys, constraints, and predictable queries. RAG needs vector similarity next to structured
filters and keyword search.

## Consequences

One database handles transactional and retrieval data, which simplifies local development and
keeps filtering close to vector search. Embedding dimensions and provider model are stored with
each vector so migrations can be explicit when a model changes.
