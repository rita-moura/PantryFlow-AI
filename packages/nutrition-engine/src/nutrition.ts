import { NutritionValidationError } from './errors.js';
import type { NutritionFacts } from './types.js';

export const ZERO_NUTRITION: NutritionFacts = Object.freeze({
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
});

export function roundNutrition(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

export function assertNutritionFacts(nutrition: NutritionFacts): void {
  for (const [name, value] of Object.entries(nutrition)) {
    if (!Number.isFinite(value) || value < 0) {
      throw new NutritionValidationError(`${name} must be a finite, non-negative number.`);
    }
  }
}

export function scaleNutrition(nutrition: NutritionFacts, multiplier: number): NutritionFacts {
  assertNutritionFacts(nutrition);
  if (!Number.isFinite(multiplier) || multiplier < 0) {
    throw new NutritionValidationError('Nutrition multiplier must be finite and non-negative.');
  }

  return {
    calories: roundNutrition(nutrition.calories * multiplier),
    proteinG: roundNutrition(nutrition.proteinG * multiplier),
    carbsG: roundNutrition(nutrition.carbsG * multiplier),
    fatG: roundNutrition(nutrition.fatG * multiplier),
    fiberG: roundNutrition(nutrition.fiberG * multiplier),
  };
}

export function sumNutrition(entries: readonly NutritionFacts[]): NutritionFacts {
  const total = entries.reduce((sum, entry) => {
    assertNutritionFacts(entry);
    return {
      calories: sum.calories + entry.calories,
      proteinG: sum.proteinG + entry.proteinG,
      carbsG: sum.carbsG + entry.carbsG,
      fatG: sum.fatG + entry.fatG,
      fiberG: sum.fiberG + entry.fiberG,
    };
  }, ZERO_NUTRITION);

  return scaleNutrition(total, 1);
}
