# Foods and nutrition data

Phase 4 adds a local food catalog behind the `NutritionDataProvider` interface. `GET /foods/search?query=...`
first searches the local `foods` and `food_nutrients` tables. Only when there are no local matches does
the API ask the configured external providers, normalize their response, persist it, and return it.

USDA is used when `USDA_API_KEY` is configured. Open Food Facts is available as a public fallback. Both
adapters convert provider-specific nutrient identifiers and field names into the same per-basis nutrition
contract. Provider failures are isolated so the next provider can be attempted.

Persisted foods are keyed by `(source, externalId)`, and each food has one current nutrient record. This
prevents repeated searches from creating duplicate catalog records or nutrient facts. External calls are
not made when a local search returns a result.

The providers are deliberately injected behind an interface so additional sources can be added without
coupling domain services to HTTP response formats. Provider adapters do not perform nutrition calculations;
they only normalize source data. Nutrition calculations remain in `packages/nutrition-engine`.

```bash
curl 'http://localhost:3000/foods/search?query=rice&limit=10'
```
