# Recipes

Phase 5 adds the recipe API and connects recipe ingredients to persisted `foods`. The API exposes
`POST /recipes`, `GET /recipes`, and `GET /recipes/:id`. Recipe ownership uses the same local
development identity boundary as Pantry until authentication is introduced.

Creating a recipe validates that every ingredient references an existing food, stores the recipe and
ingredient rows in one transaction, and computes a content hash for provenance. The response includes
total and per-serving nutrition calculated by `packages/nutrition-engine` from each food's nutrient
basis and the ingredient quantity/unit.

Nutrition is recalculated when a recipe is read, so the API never stores a stale calculated total in
the recipe record. The database stores the source recipe data and ingredient relationships; the
deterministic engine remains the authority for calories, protein, carbohydrates, fat, and fiber.

Example request:

```json
{
  "title": "Protein oats",
  "description": "Oats with yogurt.",
  "instructions": ["Mix and serve."],
  "prepMinutes": 5,
  "servings": 2,
  "ingredients": [{ "foodId": "...", "quantity": 100, "unit": "g" }]
}
```
