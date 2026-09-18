import { calculateRemainingGoals } from './engine.js';
import { createDeterministicMealPlan } from './planner.js';
import type {
  LiveMealPlanItem,
  MealPlannerCandidate,
  MealPlannerPantryItem,
  NutritionFacts,
  NutritionGoals,
} from './types.js';

function positiveRemaining(value: number | undefined): number | undefined {
  return value === undefined ? undefined : Math.max(1, value);
}

/** Replans only future slots. Consumed items remain byte-for-byte unchanged. */
export function replanFutureMeals(
  items: readonly LiveMealPlanItem[],
  candidates: readonly MealPlannerCandidate[],
  goals: NutritionGoals,
  consumed: NutritionFacts,
  pantry: readonly MealPlannerPantryItem[] = [],
): readonly LiveMealPlanItem[] {
  const future = items.filter((item) => item.status !== 'CONSUMED');
  if (future.length === 0) return items;
  const remaining = calculateRemainingGoals(goals, consumed);
  const remainingGoals: NutritionGoals = {
    targetCalories: positiveRemaining(remaining.calories)!,
    targetProteinG: positiveRemaining(remaining.proteinG)!,
    targetCarbsG: positiveRemaining(remaining.carbsG),
    targetFatG: positiveRemaining(remaining.fatG),
    targetFiberG: positiveRemaining(remaining.fiberG),
  };
  const replacement = createDeterministicMealPlan(
    candidates,
    remainingGoals,
    pantry,
    future.length,
  ).meals;
  const replacementBySlot = future.map((item, index) => ({
    ...item,
    recipeId: replacement[index]?.candidate.recipeId ?? item.recipeId,
    nutrition: replacement[index]?.candidate.nutrition ?? item.nutrition,
    status: replacement[index] ? ('REPLACED' as const) : item.status,
  }));
  let futureIndex = 0;
  return items.map((item) =>
    item.status === 'CONSUMED' ? item : (replacementBySlot[futureIndex++] ?? item),
  );
}
