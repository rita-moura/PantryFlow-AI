import type { NutritionFacts } from '@pantryflow/nutrition-engine';

export interface CreateRecipeIngredientData {
  readonly foodId: string;
  readonly quantity: number;
  readonly unit: string;
  readonly optional?: boolean;
}

export interface CreateRecipeData {
  readonly title: string;
  readonly description: string;
  readonly instructions: readonly string[];
  readonly prepMinutes: number;
  readonly cookMinutes?: number;
  readonly servings: number;
  readonly source?: string;
  readonly sourceUrl?: string;
  readonly ingredients: readonly CreateRecipeIngredientData[];
}

export interface RecipeIngredientRecord extends CreateRecipeIngredientData {
  readonly id: string;
  readonly foodName: string;
  readonly nutrition: {
    readonly basisQuantity: number;
    readonly basisUnit: string;
    readonly perBasis: NutritionFacts;
  };
}

export interface RecipeRecord {
  readonly id: string;
  readonly ownerUserId: string | null;
  readonly title: string;
  readonly description: string;
  readonly instructions: readonly string[];
  readonly prepMinutes: number;
  readonly cookMinutes: number | null;
  readonly servings: number;
  readonly source: string;
  readonly sourceUrl: string | null;
  readonly ingredients: readonly RecipeIngredientRecord[];
  readonly nutrition: {
    readonly total: NutritionFacts;
    readonly perServing: NutritionFacts;
    readonly servings: number;
  };
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
