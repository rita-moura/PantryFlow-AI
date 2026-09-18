import { createDeterministicMealPlan, scoreMealCandidate } from '../src/index';
import type { MealPlannerCandidate, NutritionGoals } from '../src/types';

const goals: NutritionGoals = { targetCalories: 600, targetProteinG: 40 };
const candidate = (id: string, calories: number): MealPlannerCandidate => ({
  recipeId: id,
  nutrition: { calories, proteinG: 40, carbsG: 20, fatG: 10, fiberG: 5 },
  ingredients: [{ foodId: 'rice', quantity: 100, unit: 'g' }],
  prepMinutes: 20,
  preferenceScore: 0.5,
});

describe('deterministic meal planner', () => {
  it('prioritizes pantry coverage and imminent expiration', () => {
    const scored = scoreMealCandidate(candidate('soon', 300), goals, [
      { foodId: 'rice', quantity: 100, unit: 'g', expirationDate: '2026-01-02' },
    ]);
    expect(scored.pantryCoverage).toBe(1);
    expect(scored.expirationUrgency).toBeGreaterThan(0.9);
  });

  it('selects the highest scoring candidates deterministically and validates totals', () => {
    const plan = createDeterministicMealPlan(
      [candidate('b', 300), candidate('a', 300), candidate('c', 100)],
      goals,
      [],
      2,
    );
    expect(plan.meals.map((meal) => meal.candidate.recipeId)).toEqual(['a', 'b']);
    expect(plan.validation.valid).toBe(true);
  });
});
