# Shopping list

Phase 8 adds `generateShoppingList` to the deterministic Nutrition Engine. It consolidates planned
recipe ingredients by food, converts compatible units, subtracts pantry quantities, and returns only
the missing amount. Fully stocked ingredients are omitted.

Each result identifies whether the item is completely missing or only has insufficient stock. Incompatible
units are rejected instead of being mixed silently; food-specific density conversions are not attempted.

The function is pure and accepts planned ingredients and pantry snapshots, so it can be used by the
future persisted shopping-list service without coupling calculations to a database or an LLM.
