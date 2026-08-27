import {
  IncompatibleUnitError,
  NutritionValidationError,
  UnsupportedUnitError,
  calculateDailyProgress,
  calculateFoodNutrition,
  calculateMealNutrition,
  calculateRecipeNutrition,
  calculateRemainingGoals,
  normalizeQuantity,
  validateMealPlan,
  type FoodNutritionInput,
  type NutritionFacts,
  type NutritionGoals,
} from '../src/index.js';

const oatsPer100G: FoodNutritionInput = {
  basisQuantity: 100,
  basisUnit: 'g',
  quantity: 50,
  unit: 'g',
  nutritionPerBasis: { calories: 389, proteinG: 16.9, carbsG: 66.3, fatG: 6.9, fiberG: 10.6 },
};

const milkPer100Ml: FoodNutritionInput = {
  basisQuantity: 100,
  basisUnit: 'ml',
  quantity: 200,
  unit: 'ml',
  nutritionPerBasis: { calories: 61, proteinG: 3.2, carbsG: 4.8, fatG: 3.3, fiberG: 0 },
};

describe('normalizeQuantity', () => {
  it.each([
    [1, 'kg', 'g', 1000],
    [500, 'mg', 'g', 0.5],
    [2, 'cups', 'ml', 480],
    [1, 'tablespoon', 'ml', 15],
    [2, 'pieces', 'unit', 2],
  ])('converts %s %s to %s', (quantity, from, to, expected) => {
    expect(normalizeQuantity(quantity, from, to)).toBe(expected);
  });

  it('rejects mass-to-volume conversions because density is unknown', () => {
    expect(() => normalizeQuantity(100, 'g', 'ml')).toThrow(IncompatibleUnitError);
  });

  it('rejects unsupported units and negative quantities', () => {
    expect(() => normalizeQuantity(1, 'bowl', 'g')).toThrow(UnsupportedUnitError);
    expect(() => normalizeQuantity(-1, 'g', 'kg')).toThrow(NutritionValidationError);
  });
});

describe('food and recipe calculations', () => {
  it('scales food nutrients from their declared basis', () => {
    expect(calculateFoodNutrition(oatsPer100G)).toEqual({
      calories: 194.5,
      proteinG: 8.45,
      carbsG: 33.15,
      fatG: 3.45,
      fiberG: 5.3,
    });
  });

  it('normalizes units before scaling nutrition', () => {
    expect(calculateFoodNutrition({ ...oatsPer100G, quantity: 0.2, unit: 'kg' }).calories).toBe(
      778,
    );
  });

  it('calculates recipe totals and per-serving nutrition', () => {
    expect(calculateRecipeNutrition([oatsPer100G, milkPer100Ml], 2)).toEqual({
      total: { calories: 316.5, proteinG: 14.85, carbsG: 42.75, fatG: 10.05, fiberG: 5.3 },
      perServing: { calories: 158.25, proteinG: 7.425, carbsG: 21.375, fatG: 5.025, fiberG: 2.65 },
      servings: 2,
    });
  });

  it('rejects empty recipes and invalid basis quantities', () => {
    expect(() => calculateRecipeNutrition([], 1)).toThrow(NutritionValidationError);
    expect(() => calculateFoodNutrition({ ...oatsPer100G, basisQuantity: 0 })).toThrow(
      NutritionValidationError,
    );
  });
});

describe('meal and daily progress calculations', () => {
  const breakfast: NutritionFacts = {
    calories: 500,
    proteinG: 30,
    carbsG: 65,
    fatG: 14,
    fiberG: 8,
  };
  const lunch: NutritionFacts = {
    calories: 700,
    proteinG: 45,
    carbsG: 80,
    fatG: 22,
    fiberG: 10,
  };
  const goals: NutritionGoals = {
    targetCalories: 2000,
    targetProteinG: 110,
    targetCarbsG: 250,
    targetFatG: 70,
    targetFiberG: 30,
  };

  it('combines meal components and applies serving multipliers', () => {
    expect(
      calculateMealNutrition([{ nutrition: breakfast }, { nutrition: lunch, multiplier: 0.5 }]),
    ).toEqual({ calories: 850, proteinG: 52.5, carbsG: 105, fatG: 25, fiberG: 13 });
  });

  it('calculates consumed totals, remaining goals, and completion percentages', () => {
    expect(calculateDailyProgress(goals, [breakfast, lunch])).toEqual({
      consumed: { calories: 1200, proteinG: 75, carbsG: 145, fatG: 36, fiberG: 18 },
      remaining: { calories: 800, proteinG: 35, carbsG: 105, fatG: 34, fiberG: 12 },
      completionPercentage: {
        calories: 60,
        proteinG: 68.18,
        carbsG: 58,
        fatG: 51.43,
        fiberG: 60,
      },
    });
  });

  it('keeps exceeded targets negative and omits goals that were not configured', () => {
    expect(
      calculateRemainingGoals(
        { targetCalories: 1000, targetProteinG: 50 },
        { calories: 1200, proteinG: 60, carbsG: 20, fatG: 10, fiberG: 4 },
      ),
    ).toEqual({
      calories: -200,
      proteinG: -10,
      carbsG: undefined,
      fatG: undefined,
      fiberG: undefined,
    });
  });

  it('rejects non-finite or negative nutrition values', () => {
    expect(() =>
      calculateMealNutrition([{ nutrition: { ...breakfast, calories: Number.NaN } }]),
    ).toThrow(NutritionValidationError);
    expect(() => calculateMealNutrition([{ nutrition: breakfast, multiplier: -1 }])).toThrow(
      NutritionValidationError,
    );
    expect(() =>
      calculateRemainingGoals(
        { targetCalories: 2000, targetProteinG: 100, targetFiberG: -1 },
        breakfast,
      ),
    ).toThrow(NutritionValidationError);
  });
});

describe('validateMealPlan', () => {
  const goals: NutritionGoals = {
    targetCalories: 2000,
    targetProteinG: 100,
    targetCarbsG: 250,
    targetFatG: 70,
    targetFiberG: 30,
  };

  it('accepts a plan within deterministic tolerances', () => {
    const result = validateMealPlan(
      [
        {
          nutrition: { calories: 2000, proteinG: 100, carbsG: 250, fatG: 70, fiberG: 30 },
        },
      ],
      goals,
    );

    expect(result.valid).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('returns structured violations for an invalid plan', () => {
    const result = validateMealPlan(
      [
        {
          nutrition: { calories: 1500, proteinG: 70, carbsG: 300, fatG: 90, fiberG: 20 },
        },
      ],
      goals,
    );

    expect(result.valid).toBe(false);
    expect(result.violations.map(({ code }) => code)).toEqual([
      'CALORIES_BELOW_MINIMUM',
      'PROTEIN_BELOW_MINIMUM',
      'CARBS_ABOVE_MAXIMUM',
      'FAT_ABOVE_MAXIMUM',
      'FIBER_BELOW_MINIMUM',
    ]);
  });

  it('supports explicit validation tolerances', () => {
    const result = validateMealPlan(
      [{ nutrition: { calories: 1600, proteinG: 80, carbsG: 0, fatG: 0, fiberG: 0 } }],
      { targetCalories: 2000, targetProteinG: 100 },
      { minimumCaloriesRatio: 0.8, minimumProteinRatio: 0.8 },
    );
    expect(result.valid).toBe(true);
  });

  it('rejects contradictory validation tolerances', () => {
    expect(() =>
      validateMealPlan([], goals, { minimumCaloriesRatio: 1.2, maximumCaloriesRatio: 1.1 }),
    ).toThrow(NutritionValidationError);
  });
});
