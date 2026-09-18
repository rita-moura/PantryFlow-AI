import { calculateMealNutrition, validateMealPlan } from './engine.js';
import type {
  DeterministicMealPlan,
  MealPlannerCandidate,
  MealPlannerPantryItem,
  MealPlannerWeights,
  NutritionGoals,
  ScoredMealCandidate,
} from './types.js';

const defaultWeights: Required<MealPlannerWeights> = {
  nutritionFit: 0.4,
  pantryCoverage: 0.2,
  expirationUrgency: 0.15,
  preferenceScore: 0.15,
  prepTime: 0.1,
};

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function nutritionFit(candidate: MealPlannerCandidate, goals: NutritionGoals): number {
  const ratios = [
    candidate.nutrition.calories / goals.targetCalories,
    candidate.nutrition.proteinG / goals.targetProteinG,
  ];
  return clamp(1 - ratios.reduce((total, ratio) => total + Math.abs(1 - ratio), 0) / ratios.length);
}

function pantryCoverage(
  candidate: MealPlannerCandidate,
  pantry: readonly MealPlannerPantryItem[],
): number {
  if (candidate.ingredients.length === 0) return 0;
  const covered = candidate.ingredients.filter((ingredient) => {
    const item = pantry.find(
      (pantryItem) =>
        pantryItem.foodId === ingredient.foodId && pantryItem.unit === ingredient.unit,
    );
    return item !== undefined && item.quantity >= ingredient.quantity;
  });
  return covered.length / candidate.ingredients.length;
}

function expirationUrgency(
  candidate: MealPlannerCandidate,
  pantry: readonly MealPlannerPantryItem[],
  today: Date,
): number {
  const dates = candidate.ingredients
    .map((ingredient) => pantry.find((item) => item.foodId === ingredient.foodId)?.expirationDate)
    .filter((date): date is string => date !== undefined)
    .map((date) => Date.parse(date) - today.getTime());
  if (dates.length === 0) return 0;
  const soonestDays = Math.min(...dates) / 86_400_000;
  return clamp((14 - soonestDays) / 14);
}

export function scoreMealCandidate(
  candidate: MealPlannerCandidate,
  goals: NutritionGoals,
  pantry: readonly MealPlannerPantryItem[],
  today = new Date('2026-01-01T00:00:00.000Z'),
  weights: MealPlannerWeights = {},
): ScoredMealCandidate {
  const applied = { ...defaultWeights, ...weights };
  const scores = {
    nutritionFit: nutritionFit(candidate, goals),
    pantryCoverage: pantryCoverage(candidate, pantry),
    expirationUrgency: expirationUrgency(candidate, pantry, today),
    preferenceScore: clamp(candidate.preferenceScore ?? 0),
    prepTimeScore: clamp(1 - candidate.prepMinutes / 120),
  };
  const score =
    scores.nutritionFit * applied.nutritionFit +
    scores.pantryCoverage * applied.pantryCoverage +
    scores.expirationUrgency * applied.expirationUrgency +
    scores.preferenceScore * applied.preferenceScore +
    scores.prepTimeScore * applied.prepTime;
  return { candidate, score, ...scores };
}

export function createDeterministicMealPlan(
  candidates: readonly MealPlannerCandidate[],
  goals: NutritionGoals,
  pantry: readonly MealPlannerPantryItem[],
  mealCount: number,
  today = new Date('2026-01-01T00:00:00.000Z'),
  weights: MealPlannerWeights = {},
): DeterministicMealPlan {
  if (!Number.isInteger(mealCount) || mealCount <= 0)
    throw new Error('Meal count must be positive.');
  const scored = candidates
    .map((candidate) => scoreMealCandidate(candidate, goals, pantry, today, weights))
    .sort(
      (left, right) =>
        right.score - left.score || left.candidate.recipeId.localeCompare(right.candidate.recipeId),
    );
  const meals = scored.slice(0, mealCount);
  const validation = validateMealPlan(
    meals.map(({ candidate }) => ({ nutrition: candidate.nutrition })),
    goals,
  );
  return { meals, validation };
}

export { calculateMealNutrition };
