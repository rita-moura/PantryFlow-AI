export interface NutritionFacts {
  readonly calories: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly fiberG: number;
}

export interface NutritionGoals {
  readonly targetCalories: number;
  readonly targetProteinG: number;
  readonly targetCarbsG?: number;
  readonly targetFatG?: number;
  readonly targetFiberG?: number;
}

export interface FoodNutritionInput {
  readonly basisQuantity: number;
  readonly basisUnit: string;
  readonly nutritionPerBasis: NutritionFacts;
  readonly quantity: number;
  readonly unit: string;
}

export interface RecipeNutrition {
  readonly total: NutritionFacts;
  readonly perServing: NutritionFacts;
  readonly servings: number;
}

export interface MealComponent {
  readonly nutrition: NutritionFacts;
  readonly multiplier?: number;
}

export interface RemainingGoals {
  readonly calories: number;
  readonly proteinG: number;
  readonly carbsG?: number;
  readonly fatG?: number;
  readonly fiberG?: number;
}

export type GoalCompletion = RemainingGoals;

export interface DailyProgress {
  readonly consumed: NutritionFacts;
  readonly remaining: RemainingGoals;
  readonly completionPercentage: GoalCompletion;
}

export type MealPlanViolationCode =
  | 'CALORIES_BELOW_MINIMUM'
  | 'CALORIES_ABOVE_MAXIMUM'
  | 'PROTEIN_BELOW_MINIMUM'
  | 'CARBS_ABOVE_MAXIMUM'
  | 'FAT_ABOVE_MAXIMUM'
  | 'FIBER_BELOW_MINIMUM';

export interface MealPlanViolation {
  readonly code: MealPlanViolationCode;
  readonly actual: number;
  readonly expected: number;
}

export interface MealPlanValidationOptions {
  readonly minimumCaloriesRatio?: number;
  readonly maximumCaloriesRatio?: number;
  readonly minimumProteinRatio?: number;
  readonly maximumCarbsRatio?: number;
  readonly maximumFatRatio?: number;
  readonly minimumFiberRatio?: number;
}

export interface MealPlanValidation {
  readonly valid: boolean;
  readonly totals: NutritionFacts;
  readonly violations: readonly MealPlanViolation[];
}

export interface MealPlannerIngredient {
  readonly foodId: string;
  readonly quantity: number;
  readonly unit: string;
}

export interface MealPlannerPantryItem {
  readonly foodId: string;
  readonly quantity: number;
  readonly unit: string;
  readonly expirationDate?: string;
}

export interface MealPlannerCandidate {
  readonly recipeId: string;
  readonly nutrition: NutritionFacts;
  readonly ingredients: readonly MealPlannerIngredient[];
  readonly prepMinutes: number;
  readonly preferenceScore?: number;
}

export interface MealPlannerWeights {
  readonly nutritionFit?: number;
  readonly pantryCoverage?: number;
  readonly expirationUrgency?: number;
  readonly preferenceScore?: number;
  readonly prepTime?: number;
}

export interface ScoredMealCandidate {
  readonly candidate: MealPlannerCandidate;
  readonly score: number;
  readonly nutritionFit: number;
  readonly pantryCoverage: number;
  readonly expirationUrgency: number;
  readonly preferenceScore: number;
  readonly prepTimeScore: number;
}

export interface DeterministicMealPlan {
  readonly meals: readonly ScoredMealCandidate[];
  readonly validation: MealPlanValidation;
}

export type LiveMealItemStatus = 'PLANNED' | 'CONSUMED' | 'SKIPPED' | 'REPLACED';

export interface LiveMealPlanItem {
  readonly id: string;
  readonly recipeId: string;
  readonly nutrition: NutritionFacts;
  readonly status: LiveMealItemStatus;
}
