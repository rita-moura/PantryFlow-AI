import { NutritionValidationError } from './errors.js';
import { assertNutritionFacts, roundNutrition, scaleNutrition, sumNutrition } from './nutrition.js';
import type {
  DailyProgress,
  FoodNutritionInput,
  GoalCompletion,
  MealComponent,
  MealPlanValidation,
  MealPlanValidationOptions,
  MealPlanViolation,
  NutritionFacts,
  NutritionGoals,
  RecipeNutrition,
  RemainingGoals,
} from './types.js';
import { normalizeQuantity } from './units.js';

function assertPositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new NutritionValidationError(`${name} must be a finite number greater than zero.`);
  }
}

function goalPercentage(consumed: number, target: number): number {
  assertPositive(target, 'Nutrition goal');
  return Math.round((consumed / target) * 10_000) / 100;
}

function assertGoals(goals: NutritionGoals): void {
  assertPositive(goals.targetCalories, 'Calories target');
  assertPositive(goals.targetProteinG, 'Protein target');
  const optionalGoals = [
    ['Carbohydrates target', goals.targetCarbsG],
    ['Fat target', goals.targetFatG],
    ['Fiber target', goals.targetFiberG],
  ] as const;
  for (const [name, value] of optionalGoals) {
    if (value !== undefined) assertPositive(value, name);
  }
}

export function calculateFoodNutrition(input: FoodNutritionInput): NutritionFacts {
  assertPositive(input.basisQuantity, 'Basis quantity');
  const quantityInBasisUnit = normalizeQuantity(input.quantity, input.unit, input.basisUnit);
  return scaleNutrition(input.nutritionPerBasis, quantityInBasisUnit / input.basisQuantity);
}

export function calculateRecipeNutrition(
  ingredients: readonly FoodNutritionInput[],
  servings: number,
): RecipeNutrition {
  assertPositive(servings, 'Recipe servings');
  if (ingredients.length === 0) {
    throw new NutritionValidationError('A recipe must contain at least one ingredient.');
  }

  const total = sumNutrition(ingredients.map(calculateFoodNutrition));
  return { total, perServing: scaleNutrition(total, 1 / servings), servings };
}

export function calculateMealNutrition(components: readonly MealComponent[]): NutritionFacts {
  return sumNutrition(
    components.map(({ nutrition, multiplier = 1 }) => scaleNutrition(nutrition, multiplier)),
  );
}

export function calculateRemainingGoals(
  goals: NutritionGoals,
  consumed: NutritionFacts,
): RemainingGoals {
  assertGoals(goals);
  assertNutritionFacts(consumed);

  const remaining = (target: number | undefined, actual: number): number | undefined =>
    target === undefined ? undefined : Math.round((target - actual) * 1000) / 1000;

  return {
    calories: remaining(goals.targetCalories, consumed.calories)!,
    proteinG: remaining(goals.targetProteinG, consumed.proteinG)!,
    carbsG: remaining(goals.targetCarbsG, consumed.carbsG),
    fatG: remaining(goals.targetFatG, consumed.fatG),
    fiberG: remaining(goals.targetFiberG, consumed.fiberG),
  };
}

export function calculateDailyProgress(
  goals: NutritionGoals,
  consumedEntries: readonly NutritionFacts[],
): DailyProgress {
  assertGoals(goals);
  const consumed = sumNutrition(consumedEntries);
  const percentage = (target: number | undefined, actual: number): number | undefined =>
    target === undefined ? undefined : goalPercentage(actual, target);
  const completionPercentage: GoalCompletion = {
    calories: goalPercentage(consumed.calories, goals.targetCalories),
    proteinG: goalPercentage(consumed.proteinG, goals.targetProteinG),
    carbsG: percentage(goals.targetCarbsG, consumed.carbsG),
    fatG: percentage(goals.targetFatG, consumed.fatG),
    fiberG: percentage(goals.targetFiberG, consumed.fiberG),
  };

  return { consumed, remaining: calculateRemainingGoals(goals, consumed), completionPercentage };
}

const defaultValidationOptions: Required<MealPlanValidationOptions> = {
  minimumCaloriesRatio: 0.9,
  maximumCaloriesRatio: 1.1,
  minimumProteinRatio: 0.9,
  maximumCarbsRatio: 1.1,
  maximumFatRatio: 1.1,
  minimumFiberRatio: 0.9,
};

export function validateMealPlan(
  meals: readonly MealComponent[],
  goals: NutritionGoals,
  options: MealPlanValidationOptions = {},
): MealPlanValidation {
  assertGoals(goals);
  const rules = { ...defaultValidationOptions, ...options };
  for (const [name, ratio] of Object.entries(rules)) assertPositive(ratio, name);
  if (rules.minimumCaloriesRatio > rules.maximumCaloriesRatio) {
    throw new NutritionValidationError(
      'Minimum calories ratio cannot be greater than maximum calories ratio.',
    );
  }

  const totals = calculateMealNutrition(meals);
  const violations: MealPlanViolation[] = [];
  const addViolation = (
    condition: boolean,
    code: MealPlanViolation['code'],
    actual: number,
    expected: number,
  ): void => {
    if (condition) violations.push({ code, actual, expected: roundNutrition(expected) });
  };

  const minimumCalories = goals.targetCalories * rules.minimumCaloriesRatio;
  const maximumCalories = goals.targetCalories * rules.maximumCaloriesRatio;
  addViolation(
    totals.calories < minimumCalories,
    'CALORIES_BELOW_MINIMUM',
    totals.calories,
    minimumCalories,
  );
  addViolation(
    totals.calories > maximumCalories,
    'CALORIES_ABOVE_MAXIMUM',
    totals.calories,
    maximumCalories,
  );

  const minimumProtein = goals.targetProteinG * rules.minimumProteinRatio;
  addViolation(
    totals.proteinG < minimumProtein,
    'PROTEIN_BELOW_MINIMUM',
    totals.proteinG,
    minimumProtein,
  );

  if (goals.targetCarbsG !== undefined) {
    const maximum = goals.targetCarbsG * rules.maximumCarbsRatio;
    addViolation(totals.carbsG > maximum, 'CARBS_ABOVE_MAXIMUM', totals.carbsG, maximum);
  }
  if (goals.targetFatG !== undefined) {
    const maximum = goals.targetFatG * rules.maximumFatRatio;
    addViolation(totals.fatG > maximum, 'FAT_ABOVE_MAXIMUM', totals.fatG, maximum);
  }
  if (goals.targetFiberG !== undefined) {
    const minimum = goals.targetFiberG * rules.minimumFiberRatio;
    addViolation(totals.fiberG < minimum, 'FIBER_BELOW_MINIMUM', totals.fiberG, minimum);
  }

  return { valid: violations.length === 0, totals, violations };
}
