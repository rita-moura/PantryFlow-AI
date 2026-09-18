import { createToolRegistry, emptyToolInput } from '../src/tools.js';
import type { ToolHandlers } from '../src/tools.js';

const handlers = (): ToolHandlers => ({
  getPantryItems: jest.fn().mockResolvedValue([]),
  getExpiringItems: jest.fn().mockResolvedValue([]),
  getNutritionGoals: jest.fn().mockResolvedValue({}),
  getDailyNutritionProgress: jest.fn().mockResolvedValue({}),
  searchRecipes: jest.fn().mockResolvedValue([]),
  calculateMealNutrition: jest.fn().mockResolvedValue({}),
  validateMealPlan: jest.fn().mockResolvedValue({ valid: true }),
  findFoodSubstitutions: jest.fn().mockResolvedValue([]),
  generateShoppingList: jest.fn().mockResolvedValue([]),
  updateMealPlan: jest.fn().mockResolvedValue({}),
});

describe('AI tools', () => {
  it('validates input, authenticates context, and returns typed handler output', async () => {
    const implementation = handlers();
    const registry = createToolRegistry(implementation);
    await expect(
      registry.get('getPantryItems')?.execute(emptyToolInput(), { userId: 'user-1' }),
    ).resolves.toEqual([]);
    expect(implementation.getPantryItems).toHaveBeenCalledWith({}, { userId: 'user-1' });
  });

  it('rejects unauthenticated calls and malformed inputs before the handler', async () => {
    const implementation = handlers();
    const registry = createToolRegistry(implementation);
    await expect(
      registry.get('searchRecipes')?.execute({ query: '' }, { userId: 'user-1' }),
    ).rejects.toThrow();
    await expect(registry.get('getPantryItems')?.execute({}, { userId: '' })).rejects.toThrow(
      'Authenticated',
    );
    expect(implementation.searchRecipes).not.toHaveBeenCalled();
  });

  it('exposes the complete typed tool set', () => {
    const registry = createToolRegistry(handlers());
    expect([...registry.keys()]).toEqual([
      'getPantryItems',
      'getExpiringItems',
      'getNutritionGoals',
      'getDailyNutritionProgress',
      'searchRecipes',
      'calculateMealNutrition',
      'validateMealPlan',
      'findFoodSubstitutions',
      'generateShoppingList',
      'updateMealPlan',
    ]);
  });
});
