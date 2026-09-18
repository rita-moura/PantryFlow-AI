import { MealPlanningAgent } from '../src/agent.js';
import { createToolRegistry, type ToolHandlers } from '../src/tools.js';
import { InMemoryTraceSink } from '../src/observability.js';

function handlers(): ToolHandlers {
  return {
    getPantryItems: jest.fn().mockResolvedValue([{ foodId: 'oats' }]),
    getExpiringItems: jest.fn().mockResolvedValue([{ foodId: 'banana' }]),
    getNutritionGoals: jest.fn().mockResolvedValue({ calories: 2000, protein: 110 }),
    getDailyNutritionProgress: jest.fn().mockResolvedValue({ calories: 500, protein: 30 }),
    searchRecipes: jest.fn().mockResolvedValue([{ id: 'recipe-1' }]),
    calculateMealNutrition: jest.fn().mockResolvedValue({ calories: 600, protein: 35 }),
    validateMealPlan: jest.fn().mockResolvedValue({ valid: true }),
    findFoodSubstitutions: jest.fn().mockResolvedValue([]),
    generateShoppingList: jest.fn().mockResolvedValue([{ foodId: 'rice', quantity: 1 }]),
    updateMealPlan: jest.fn().mockResolvedValue({ updated: true }),
  };
}

const proposal = {
  planId: 'plan-1',
  changes: [{ mealId: 'meal-1', recipeId: 'recipe-1' }],
  mealIds: ['meal-1'],
};

describe('MealPlanningAgent', () => {
  it('orchestrates bounded planning and persists only after validation', async () => {
    const implementation = handlers();
    const traceSink = new InMemoryTraceSink();
    const agent = new MealPlanningAgent({
      tools: createToolRegistry(implementation),
      composePlan: jest.fn().mockResolvedValue(proposal),
      traceSink,
    });

    const result = await agent.run({
      userId: 'user-1',
      goal: 'high protein dinner',
      planId: 'plan-1',
    });

    expect(result.status).toBe('completed');
    expect(result.steps).toBe(6);
    expect(result.toolCalls).toBe(9);
    expect(implementation.updateMealPlan).toHaveBeenCalledWith(
      { planId: 'plan-1', changes: proposal.changes },
      { userId: 'user-1' },
    );
    expect(implementation.generateShoppingList).toHaveBeenCalled();
    expect(traceSink.events.map((event) => event.type)).toEqual(
      expect.arrayContaining(['request', 'agent_step', 'tool_call', 'validation', 'response']),
    );
  });

  it('does not persist an invalid plan', async () => {
    const implementation = handlers();
    implementation.validateMealPlan = jest
      .fn()
      .mockResolvedValue({ valid: false, reason: 'goals' });
    const agent = new MealPlanningAgent({
      tools: createToolRegistry(implementation),
      composePlan: () => Promise.resolve(proposal),
    });

    const result = await agent.run({ userId: 'user-1', goal: 'balanced lunch', planId: 'plan-1' });

    expect(result.status).toBe('rejected');
    expect(implementation.updateMealPlan).not.toHaveBeenCalled();
    expect(implementation.generateShoppingList).not.toHaveBeenCalled();
  });

  it('enforces the tool-call limit before executing another tool', async () => {
    const implementation = handlers();
    const agent = new MealPlanningAgent({
      tools: createToolRegistry(implementation),
      composePlan: () => Promise.resolve(proposal),
      config: { maxToolCalls: 5 },
    });

    await expect(
      agent.run({ userId: 'user-1', goal: 'quick meal', planId: 'plan-1' }),
    ).rejects.toThrow('tool-call limit');
  });
});
