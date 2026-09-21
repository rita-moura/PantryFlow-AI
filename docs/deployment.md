# Free deployment

Phase 19 prepares the intended free deployment topology:

```text
Angular frontend → Vercel
NestJS API       → Render
PostgreSQL       → Supabase (pgvector enabled)
LLM/embeddings   → Gemini
Observability    → Langfuse
```

The repository includes [`vercel.json`](../vercel.json) and [`render.yaml`](../render.yaml).
Vercel builds the `@pantryflow/web` workspace and serves `apps/web/dist/web/browser`. Render builds
the API workspace, starts `apps/api/dist/main.js`, and checks `GET /health`.

## Environment variables

Set these values in the provider dashboards. Never commit a populated `.env` file or put server
secrets in Vercel:

| Provider   | Variables                                                                                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Render API | `NODE_ENV=production`, `PORT`, `DATABASE_URL`, `FRONTEND_URL`, `GEMINI_API_KEY`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL` |
| Supabase   | Use the pooled or direct Postgres URL as Render's `DATABASE_URL`; enable the `vector` extension before migrations                                  |
| Vercel     | Public frontend configuration only, such as `API_URL` when the frontend starts consuming the remote API                                            |
| Langfuse   | `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, and optional `LANGFUSE_BASE_URL` on Render only                                                      |

After provisioning Supabase, run `pnpm db:migrate` and `pnpm db:seed` against its connection string.
The current frontend is a static functional shell and the public guest API is available at
`/demo`; wiring browser API calls and Supabase Auth is a later product integration.

Render free services can sleep when idle. This is a platform characteristic, so production
latency and availability must be measured after deployment.
