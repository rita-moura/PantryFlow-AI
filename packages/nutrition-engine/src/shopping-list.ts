import { normalizeQuantity } from './units.js';
import type { ShoppingIngredient, ShoppingListItem } from './types.js';

interface QuantityBucket {
  readonly foodId: string;
  readonly foodName?: string;
  readonly unit: string;
  quantity: number;
}

function addToBucket(buckets: Map<string, QuantityBucket>, item: ShoppingIngredient): void {
  if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
    throw new Error('Shopping quantities must be finite and greater than zero.');
  }
  const key = item.foodId;
  const current = buckets.get(key);
  if (!current) {
    buckets.set(key, {
      foodId: item.foodId,
      foodName: item.foodName,
      unit: item.unit,
      quantity: item.quantity,
    });
    return;
  }
  current.quantity += normalizeQuantity(item.quantity, item.unit, current.unit);
}

/** Consolidates planned ingredients, subtracts compatible pantry stock, and returns missing items. */
export function generateShoppingList(
  plannedIngredients: readonly ShoppingIngredient[],
  pantryItems: readonly ShoppingIngredient[],
): readonly ShoppingListItem[] {
  const needed = new Map<string, QuantityBucket>();
  const pantry = new Map<string, QuantityBucket>();
  plannedIngredients.forEach((item) => addToBucket(needed, item));
  pantryItems.forEach((item) => addToBucket(pantry, item));
  const result: ShoppingListItem[] = [];
  for (const item of needed.values()) {
    const stock = pantry.get(item.foodId);
    const pantryQuantity = stock ? normalizeQuantity(stock.quantity, stock.unit, item.unit) : 0;
    const neededQuantity = Math.max(0, item.quantity - pantryQuantity);
    if (neededQuantity === 0) continue;
    result.push({
      foodId: item.foodId,
      foodName: item.foodName,
      quantity: neededQuantity,
      unit: item.unit,
      neededQuantity,
      pantryQuantity,
      reason: pantryQuantity === 0 ? ('MISSING' as const) : ('INSUFFICIENT_STOCK' as const),
    });
  }
  return result;
}
