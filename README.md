# PantryFlow AI

**An observable, evaluated and resource-conscious RAG & Agentic AI platform for intelligent meal planning and pantry management.**

PantryFlow AI is an open-source full-stack platform designed around a “living meal plan”. AI is a
controlled orchestration layer; deterministic code remains responsible for nutrition, inventory,
validation, and persistence.

> Current status: **Roadmap Phase 16 — AI Evaluation in progress.** Product capabilities are
> implemented incrementally; agent access is restricted to typed, authenticated tools.

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

0. Foundation — complete
1. Database — complete: Drizzle, PostgreSQL/pgvector migration, schema, and seed
2. Deterministic Nutrition Engine — complete
3. Pantry — complete
4. Foods and Nutrition Data — complete: local search, normalization, and USDA/Open Food Facts adapters
5. Recipes — complete: persisted ingredients and deterministic nutrition totals
6. Deterministic Meal Planner — complete: weighted scoring and nutrition validation
7. Cardápio Vivo — complete: consumption progress and future-only replanning
8. Shopping List — complete: consolidation and pantry subtraction
9. Functional frontend — complete: navigable dashboard and core product screens
10. Embeddings — complete: Gemini provider, hash cache, and pgvector storage
11. RAG — complete: hybrid retrieval, filters, context budgets, and grounded generation
12. AI Assistant — complete: deterministic request routing for CODE, RAG, and AGENT
13. AI Tools — complete: typed, validated, authenticated tool registry
14. Agentic AI — complete: bounded meal-planning orchestration
15. Langfuse observability — complete: sanitized traces and ingestion
16. Evaluation — in progress: deterministic, RAG, and AI metrics
17. Green AI optimization
18. Guest demo
19. Deployment
20. Portfolio documentation

See [Phase 0 decisions](docs/phase-0-foundation.md) for scope details.
See [Database architecture](docs/database.md) for the schema and migration workflow.
See [Nutrition Engine](docs/nutrition-engine.md) for deterministic calculation and validation rules.
See [Pantry](docs/pantry.md) for stock invariants and transaction history.
See [Foods and nutrition data](docs/foods.md) for provider normalization and local caching.
See [Recipes](docs/recipes.md) for recipe persistence and nutrition calculation.
See [Deterministic meal planner](docs/meal-planner.md) for scoring and validation rules.
See [Live meal plan](docs/live-meal-plan.md) for consumption and future-only replanning.
See [Shopping list](docs/shopping-list.md) for ingredient consolidation and stock subtraction.
See [Functional frontend](docs/frontend.md) for the Angular routes and screens.
See [Embeddings](docs/embeddings.md) for normalization, caching, Gemini, and vector storage.
See [RAG](docs/rag.md) for retrieval, filtering, context construction, and grounded responses.
See [AI Assistant](docs/assistant.md) for request routing and typed handlers.
See [AI Tools](docs/ai-tools.md) for the authenticated tool registry and contracts.
See [Agentic AI](docs/agentic-ai.md) for bounded meal-planning orchestration.
See [Langfuse observability](docs/langfuse.md) for trace events, sanitization, and ingestion.
See [Evaluation](docs/evaluation.md) for datasets and quality metrics.
