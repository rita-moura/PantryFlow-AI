import {
  OpenFoodFactsNutritionDataProvider,
  UsdaNutritionDataProvider,
} from './foods.providers';

function response(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('nutrition data providers', () => {
  it('normalizes USDA nutrient identifiers', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      response({
        foods: [
          {
            fdcId: 42,
            description: 'Rice',
            servingSize: 100,
            servingSizeUnit: 'g',
            foodNutrients: [
              { nutrientId: 1008, value: 130 },
              { nutrientId: 1003, value: 2.7 },
              { nutrientId: 1005, value: 28 },
              { nutrientId: 1004, value: 0.3 },
              { nutrientId: 1079, value: 0.4 },
            ],
          },
        ],
      }),
    );
    const provider = new UsdaNutritionDataProvider('key', fetcher);
    await expect(provider.search('rice', 5)).resolves.toEqual([
      expect.objectContaining({
        source: 'USDA',
        externalId: '42',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        nutrition: expect.objectContaining({ calories: 130, proteinG: 2.7 }),
      }),
    ]);
  });

  it('returns no USDA results without an API key', async () => {
    const fetcher = jest.fn();
    await expect(
      new UsdaNutritionDataProvider(undefined, fetcher).search('rice', 5),
    ).resolves.toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('normalizes Open Food Facts values per 100 grams', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      response({
        products: [
          {
            code: 'abc',
            product_name: 'Yogurt',
            brands: 'Demo',
            nutriments: {
              'energy-kcal_100g': 61,
              proteins_100g: 3.5,
              carbohydrates_100g: 4.7,
              fat_100g: 3.3,
              fiber_100g: 0,
            },
          },
        ],
      }),
    );
    const provider = new OpenFoodFactsNutritionDataProvider(fetcher);
    await expect(provider.search('yogurt', 5)).resolves.toEqual([
      expect.objectContaining({
        source: 'OPEN_FOOD_FACTS',
        externalId: 'abc',
        brand: 'Demo',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        nutrition: expect.objectContaining({ calories: 61, proteinG: 3.5 }),
      }),
    ]);
  });
});
