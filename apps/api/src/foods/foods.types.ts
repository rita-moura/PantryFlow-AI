export const FOOD_SOURCES = ['LOCAL', 'USDA', 'OPEN_FOOD_FACTS'] as const;
export type FoodSource = (typeof FOOD_SOURCES)[number];

export interface NutritionFactsData {
  readonly basisQuantity: number;
  readonly basisUnit: string;
  readonly calories: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly fiberG: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface NormalizedFood {
  readonly name: string;
  readonly brand: string | null;
  readonly source: Exclude<FoodSource, 'LOCAL'>;
  readonly externalId: string;
  readonly defaultUnit: string;
  readonly nutrition: NutritionFactsData;
}

export interface FoodRecord extends NormalizedFood {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface NutritionDataProvider {
  readonly source: Exclude<FoodSource, 'LOCAL'>;
  search(query: string, limit: number): Promise<readonly NormalizedFood[]>;
}
