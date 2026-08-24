# PantryFlow AI

**An observable, evaluated and resource-conscious RAG & Agentic AI platform for intelligent meal planning and pantry management.**

PantryFlow AI is an open-source full-stack platform designed around a “living meal plan”. AI is a
controlled orchestration layer; deterministic code remains responsible for nutrition, inventory,
validation, and persistence.

> Current status: **Roadmap Phase 1 — Database complete.** Product and AI capabilities are
> intentionally not implemented yet.

## Architecture

```text
apps/web (Angular) ──► apps/api (NestJS) ──► PostgreSQL + pgvector
        │                    │
        └─ packages/shared ◄─┤
                             ├─ packages/nutrition-engine (Phase 2)
                             └─ packages/ai (Phase 10+)
```

The monorepo uses pnpm workspaces and strict TypeScript. Package boundaries keep provider
credentials on the server and reserve calculations for deterministic domain code.

## Local development

Requirements: Node.js 20.19+, pnpm 10.15, and Docker with Compose.

```bash
corepack enable
pnpm install
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The web app runs at `http://localhost:4200`; the API runs at `http://localhost:3000`, with health at
`GET /health`. Copy `.env.example` to `.env` for overrides. Never expose server-only variables such
as `DATABASE_URL`, `GEMINI_API_KEY`, or `LANGFUSE_SECRET_KEY` to the browser.

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Pull requests run this sequence in GitHub Actions without production credentials.

## Roadmap

1. Foundation — complete
2. Database — complete: Drizzle, PostgreSQL/pgvector migration, schema, and seed
3. Deterministic Nutrition Engine — next
4. Pantry, nutrition data, recipes, deterministic planning, living plans, and shopping lists
5. Functional frontend
6. Embeddings, RAG, assistant, tools, and bounded agents
7. Observability, evaluation, Green AI, demo, deployment, and portfolio documentation

See [Phase 0 decisions](docs/phase-0-foundation.md) for scope details.
See [Database architecture](docs/database.md) for the schema and migration workflow.
