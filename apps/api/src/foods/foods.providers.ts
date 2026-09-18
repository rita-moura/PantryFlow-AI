import type { NormalizedFood, NutritionDataProvider } from './foods.types';

interface UsdaResponse {
  readonly foods?: readonly {
    readonly fdcId: number;
    readonly description: string;
    readonly brandName?: string;
    readonly servingSize?: number;
    readonly servingSizeUnit?: string;
    readonly foodNutrients?: readonly {
      readonly nutrientId: number;
      readonly value: number;
    }[];
  }[];
}

interface OpenFoodFactsResponse {
  readonly products?: readonly {
    readonly code?: string;
    readonly product_name?: string;
    readonly brands?: string;
    readonly nutriments?: Record<string, unknown>;
  }[];
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, value)
    : 0;
}

function usdaNutrient(
  nutrients:
    | readonly { readonly nutrientId: number; readonly value: number }[]
    | undefined,
  id: number,
): number {
  return numberValue(
    nutrients?.find((nutrient) => nutrient.nutrientId === id)?.value,
  );
}

export class UsdaNutritionDataProvider implements NutritionDataProvider {
  readonly source = 'USDA' as const;
  constructor(
    private readonly apiKey = process.env.USDA_API_KEY,
    private readonly fetcher: FetchLike = fetch,
  ) {}

  async search(
    query: string,
    limit: number,
  ): Promise<readonly NormalizedFood[]> {
    if (!this.apiKey) return [];
    const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('query', query);
    url.searchParams.set('pageSize', String(limit));
    const response = await this.fetcher(url.toString());
    if (!response.ok)
      throw new Error(`USDA request failed with ${response.status}.`);
    const body = (await response.json()) as UsdaResponse;
    return (body.foods ?? []).map((food) => ({
      name: food.description,
      brand: food.brandName ?? null,
      source: 'USDA' as const,
      externalId: String(food.fdcId),
      defaultUnit:
        food.servingSizeUnit?.toLowerCase() === 'g' ? 'g' : 'serving',
      nutrition: {
        basisQuantity: food.servingSize ?? 100,
        basisUnit: food.servingSizeUnit?.toLowerCase() ?? 'g',
        calories: usdaNutrient(food.foodNutrients, 1008),
        proteinG: usdaNutrient(food.foodNutrients, 1003),
        carbsG: usdaNutrient(food.foodNutrients, 1005),
        fatG: usdaNutrient(food.foodNutrients, 1004),
        fiberG: usdaNutrient(food.foodNutrients, 1079),
        metadata: { provider: 'USDA' },
      },
    }));
  }
}

export class OpenFoodFactsNutritionDataProvider implements NutritionDataProvider {
  readonly source = 'OPEN_FOOD_FACTS' as const;
  constructor(private readonly fetcher: FetchLike = fetch) {}

  async search(
    query: string,
    limit: number,
  ): Promise<readonly NormalizedFood[]> {
    const url = new URL('https://world.openfoodfacts.org/cgi/search.pl');
    url.searchParams.set('search_terms', query);
    url.searchParams.set('page_size', String(limit));
    url.searchParams.set('json', '1');
    const response = await this.fetcher(url.toString());
    if (!response.ok)
      throw new Error(
        `Open Food Facts request failed with ${response.status}.`,
      );
    const body = (await response.json()) as OpenFoodFactsResponse;
    return (body.products ?? [])
      .filter((product) => product.code && product.product_name)
      .map((product) => {
        const nutrients = product.nutriments ?? {};
        return {
          name: product.product_name as string,
          brand: product.brands ?? null,
          source: 'OPEN_FOOD_FACTS' as const,
          externalId: product.code as string,
          defaultUnit: 'g',
          nutrition: {
            basisQuantity: 100,
            basisUnit: 'g',
            calories: numberValue(nutrients['energy-kcal_100g']),
            proteinG: numberValue(nutrients['proteins_100g']),
            carbsG: numberValue(nutrients['carbohydrates_100g']),
            fatG: numberValue(nutrients['fat_100g']),
            fiberG: numberValue(nutrients['fiber_100g']),
            metadata: { provider: 'OPEN_FOOD_FACTS' },
          },
        };
      });
  }
}
