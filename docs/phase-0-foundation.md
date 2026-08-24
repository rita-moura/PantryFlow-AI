# Phase 0 — Foundation

This phase establishes a strict TypeScript pnpm workspace with Angular, NestJS, reusable package
boundaries, automated quality checks, a pgvector-compatible PostgreSQL container, and CI.

No database schema, nutrition calculations, provider, RAG, or agent behavior is included. Angular
uses standalone components; NestJS owns server configuration; the domain and AI packages are only
compile-time boundaries. Migrations and schema begin in Phase 1.

Verify with `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
