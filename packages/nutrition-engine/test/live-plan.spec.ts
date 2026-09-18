import { replanFutureMeals } from '../src/index';
import type {
  LiveMealPlanItem,
  MealPlannerCandidate,
  NutritionFacts,
  NutritionGoals,
} from '../src/types';

const nutrition = (calories: number): NutritionFacts => ({
  calories,
  proteinG: 30,
  carbsG: 20,
  fatG: 10,
  fiberG: 5,
});
const goals: NutritionGoals = { targetCalories: 800, targetProteinG: 60 };
const candidates: MealPlannerCandidate[] = [
  { recipeId: 'new-a', nutrition: nutrition(400), ingredients: [], prepMinutes: 10 },
  { recipeId: 'new-b', nutrition: nutrition(300), ingredients: [], prepMinutes: 10 },
];

describe('live meal plan replanning', () => {
  it('preserves consumed meals and replaces only future slots', () => {
    const consumed: LiveMealPlanItem = {
      id: 'meal-1',
      recipeId: 'eaten',
      nutrition: nutrition(400),
      status: 'CONSUMED',
    };
    const planned: LiveMealPlanItem = {
      id: 'meal-2',
      recipeId: 'old',
      nutrition: nutrition(400),
      status: 'PLANNED',
    };
    const result = replanFutureMeals([consumed, planned], candidates, goals, nutrition(400));
    expect(result[0]).toBe(consumed);
    expect(result[1]).toMatchObject({ id: 'meal-2', recipeId: 'new-a', status: 'REPLACED' });
  });

  it('does not change a completed plan with no future meals', () => {
    const consumed: LiveMealPlanItem = {
      id: 'meal-1',
      recipeId: 'eaten',
      nutrition: nutrition(400),
      status: 'CONSUMED',
    };
    expect(replanFutureMeals([consumed], candidates, goals, nutrition(400))).toEqual([consumed]);
  });
});
