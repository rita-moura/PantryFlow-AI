# Guest Demo

Phase 18 provides a public, bounded demo under `GET /demo` and `POST /demo/plan`. The catalog is
seeded with Chicken, Rice, Beans, Eggs, Oats, Banana, Milk, Yogurt, Broccoli, Potatoes, and
Tomatoes. The demo goals are 2,000 kcal, 110 g protein, and 30 g fiber.

`POST /demo/plan` accepts a natural-language goal and returns a deterministic pantry-first daily
plan that prioritizes foods with the nearest expiration dates. It also returns the demo pantry,
shopping list, fixed goals, and `aiCalls: 0`; no external model is called by this public path.

Abuse controls limit each client key to five requests per hour and each goal to 240 characters.
The API validation pipe enforces the same input size at the controller boundary. Demo data is
isolated from authenticated user data and can be recreated by running `pnpm db:seed`.
