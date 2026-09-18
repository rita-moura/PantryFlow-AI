export interface ToolContext {
  readonly userId: string;
}

export interface PantryToolInput {
  readonly includeExpired?: boolean;
}
export interface ExpiringItemsToolInput {
  readonly withinDays?: number;
}
export interface NutritionGoalsToolInput {
  readonly date?: string;
}
export interface DailyProgressToolInput {
  readonly date?: string;
}
export interface SearchRecipesToolInput {
  readonly query: string;
  readonly limit?: number;
}
export interface CalculateMealNutritionToolInput {
  readonly mealId: string;
}
export interface ValidateMealPlanToolInput {
  readonly planId: string;
}
export interface FoodSubstitutionsToolInput {
  readonly foodId: string;
  readonly query?: string;
}
export interface ShoppingListToolInput {
  readonly planId: string;
}
export interface UpdateMealPlanToolInput {
  readonly planId: string;
  readonly changes: readonly Record<string, unknown>[];
}

export interface ToolResultMap {
  getPantryItems: readonly Record<string, unknown>[];
  getExpiringItems: readonly Record<string, unknown>[];
  getNutritionGoals: Record<string, unknown>;
  getDailyNutritionProgress: Record<string, unknown>;
  searchRecipes: readonly Record<string, unknown>[];
  calculateMealNutrition: Record<string, unknown>;
  validateMealPlan: { readonly valid: boolean; readonly [key: string]: unknown };
  findFoodSubstitutions: readonly Record<string, unknown>[];
  generateShoppingList: readonly Record<string, unknown>[];
  updateMealPlan: Record<string, unknown>;
}

export interface ToolInputMap {
  getPantryItems: PantryToolInput;
  getExpiringItems: ExpiringItemsToolInput;
  getNutritionGoals: NutritionGoalsToolInput;
  getDailyNutritionProgress: DailyProgressToolInput;
  searchRecipes: SearchRecipesToolInput;
  calculateMealNutrition: CalculateMealNutritionToolInput;
  validateMealPlan: ValidateMealPlanToolInput;
  findFoodSubstitutions: FoodSubstitutionsToolInput;
  generateShoppingList: ShoppingListToolInput;
  updateMealPlan: UpdateMealPlanToolInput;
}

export type ToolName = keyof ToolInputMap;

export type ToolHandlers = {
  [K in ToolName]: (input: ToolInputMap[K], context: ToolContext) => Promise<ToolResultMap[K]>;
};

export interface TypedTool<K extends ToolName> {
  readonly name: K;
  readonly validate: (input: unknown) => ToolInputMap[K];
  readonly execute: (input: unknown, context: ToolContext) => Promise<ToolResultMap[K]>;
}

export type ToolDefinition = { [K in ToolName]: TypedTool<K> }[ToolName];
export type ToolRegistry = ReadonlyMap<ToolName, ToolDefinition>;

function objectInput(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Tool input must be an object.');
  return input as Record<string, unknown>;
}

function optionalPositive(value: unknown, name: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)
    throw new Error(`${name} must be positive.`);
  return value;
}

function stringField(input: Record<string, unknown>, field: string): string {
  const value = input[field];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required.`);
  return value.trim();
}

const noInput = (): Record<string, never> => ({});
const dateInput = (input: unknown): { readonly date?: string } => {
  const object = objectInput(input);
  const date = object.date;
  if (date !== undefined && typeof date !== 'string') throw new Error('date must be a string.');
  return { date };
};

export function createToolRegistry(handlers: ToolHandlers): ToolRegistry {
  const make = <K extends ToolName>(
    name: K,
    validate: (input: unknown) => ToolInputMap[K],
    handler: ToolHandlers[K],
  ): TypedTool<K> => ({
    name,
    validate,
    execute: async (input, context) => {
      if (!context.userId?.trim()) throw new Error('Authenticated user context is required.');
      return handler(validate(input), context);
    },
  });
  const pantry = (input: unknown): PantryToolInput => {
    const object = objectInput(input);
    const includeExpired = object.includeExpired;
    if (includeExpired !== undefined && typeof includeExpired !== 'boolean')
      throw new Error('includeExpired must be boolean.');
    return { includeExpired };
  };
  const expiring = (input: unknown): ExpiringItemsToolInput => ({
    withinDays: optionalPositive(objectInput(input).withinDays, 'withinDays'),
  });
  const search = (input: unknown): SearchRecipesToolInput => {
    const object = objectInput(input);
    const limit = optionalPositive(object.limit, 'limit');
    if (limit !== undefined && !Number.isInteger(limit))
      throw new Error('limit must be an integer.');
    return { query: stringField(object, 'query'), limit };
  };
  const substitutions = (input: unknown): FoodSubstitutionsToolInput => {
    const object = objectInput(input);
    const query = object.query;
    if (query !== undefined && typeof query !== 'string')
      throw new Error('query must be a string.');
    return { foodId: stringField(object, 'foodId'), query };
  };
  const idInput =
    <K extends string>(field: K) =>
    (input: unknown): { readonly [P in K]: string } =>
      ({
        [field]: stringField(objectInput(input), field),
      }) as { readonly [P in K]: string };
  const changes = (input: unknown): UpdateMealPlanToolInput => {
    const object = objectInput(input);
    if (!Array.isArray(object.changes)) throw new Error('changes must be an array.');
    if (
      object.changes.some(
        (change) => !change || typeof change !== 'object' || Array.isArray(change),
      )
    )
      throw new Error('changes must contain objects.');
    return {
      planId: stringField(object, 'planId'),
      changes: object.changes as readonly Record<string, unknown>[],
    };
  };
  const tools: ToolDefinition[] = [
    make('getPantryItems', pantry, handlers.getPantryItems),
    make('getExpiringItems', expiring, handlers.getExpiringItems),
    make('getNutritionGoals', dateInput, handlers.getNutritionGoals),
    make('getDailyNutritionProgress', dateInput, handlers.getDailyNutritionProgress),
    make('searchRecipes', search, handlers.searchRecipes),
    make('calculateMealNutrition', idInput('mealId'), handlers.calculateMealNutrition),
    make('validateMealPlan', idInput('planId'), handlers.validateMealPlan),
    make('findFoodSubstitutions', substitutions, handlers.findFoodSubstitutions),
    make('generateShoppingList', idInput('planId'), handlers.generateShoppingList),
    make('updateMealPlan', changes, handlers.updateMealPlan),
  ];
  return new Map(tools.map((tool) => [tool.name, tool]));
}

export function emptyToolInput(): Record<string, never> {
  return noInput();
}
