export interface DemoFood {
  readonly id: string;
  readonly name: string;
  readonly quantity: number;
  readonly unit: string;
  readonly expiresInDays: number;
  readonly caloriesPerUnit: number;
  readonly proteinPerUnit: number;
  readonly fiberPerUnit: number;
}

export interface DemoMeal {
  readonly mealType: string;
  readonly title: string;
  readonly foods: readonly string[];
  readonly calories: number;
  readonly protein: number;
  readonly fiber: number;
}

export interface DemoPlanResponse {
  readonly mode: 'guest-demo';
  readonly goals: {
    readonly calories: 2000;
    readonly protein: 110;
    readonly fiber: 30;
  };
  readonly meals: readonly DemoMeal[];
  readonly pantry: readonly DemoFood[];
  readonly shoppingList: readonly string[];
  readonly aiCalls: 0;
}
