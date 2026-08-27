# Pantry

The Pantry module exposes `GET /pantry`, `POST /pantry`, `PATCH /pantry/:id`, and
`DELETE /pantry/:id`. DTO validation rejects unknown fields and invalid UUIDs, dates, and numeric
values before they reach domain logic.

## Stock history

Creating an item atomically records a `PURCHASE`. Every quantity change requires an explicit
transaction type and reason and records its signed delta. `PURCHASE` must increase stock;
`CONSUMPTION` and `WASTE` must reduce it; `ADJUSTMENT` may move in either direction.

Inventory cannot be negative. This rule is enforced by DTO validation, the Pantry service, and a
PostgreSQL check constraint. Repository writes lock the item row while calculating the delta so
concurrent changes cannot silently overwrite stock history.

Deletion is logical: the remaining quantity is recorded as `WASTE`, quantity becomes zero, and
`deleted_at` hides the item from future reads. Transactions remain available for audit.

## Development identity

Authentication is not part of Phase 3. Locally, the module uses the seeded profile configured by
`LOCAL_PROFILE_ID`; it never accepts `userId` from request body or query parameters. In production,
the API refuses this fallback. A future authentication phase will replace this development-only
identity provider with the verified Supabase token subject.
