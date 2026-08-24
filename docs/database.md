# Database architecture

PantryFlow uses PostgreSQL 17, pgvector, and Drizzle ORM. The versioned SQL migrations in
`drizzle/` are the source of truth; schema changes must never be applied manually.

## Identity boundary

`profiles.id` stores the UUID issued by Supabase Auth. Domain tables reference `profiles`, keeping
the schema runnable on plain local PostgreSQL without attempting to create or modify Supabase's
protected `auth` schema. API authentication and authorization are introduced in their roadmap
phase.

## Schema

The initial schema covers profiles, nutrition-goal history, foods and nutrient facts, pantry stock
and transactions, recipes and ingredients, meal plans and consumption snapshots, shopping lists,
and user preferences. Quantities use fixed-precision `numeric` columns rather than floating point.

Recipe embeddings reserve `vector(768)` storage, but embedding generation and vector indexes are
intentionally deferred until Phase 10. The initial migration enables the `vector` extension.

## Commands

```bash
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:studio
```

`db:seed` is idempotent and creates only a local development profile and its explicit nutrition
goal. It does not seed the future guest-demo food catalog.

If port `5432` is already occupied, set both `POSTGRES_PORT` and the port in `DATABASE_URL` to an
available value before starting Compose.
