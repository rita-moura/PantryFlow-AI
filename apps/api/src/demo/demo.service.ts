import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { DemoFood, DemoPlanResponse } from './demo.types';

const DEMO_FOODS: readonly DemoFood[] = [
  {
    id: 'chicken',
    name: 'Chicken',
    quantity: 500,
    unit: 'g',
    expiresInDays: 1,
    caloriesPerUnit: 165,
    proteinPerUnit: 31,
    fiberPerUnit: 0,
  },
  {
    id: 'rice',
    name: 'Rice',
    quantity: 500,
    unit: 'g',
    expiresInDays: 30,
    caloriesPerUnit: 130,
    proteinPerUnit: 2.7,
    fiberPerUnit: 0.4,
  },
  {
    id: 'beans',
    name: 'Beans',
    quantity: 400,
    unit: 'g',
    expiresInDays: 5,
    caloriesPerUnit: 127,
    proteinPerUnit: 8.7,
    fiberPerUnit: 6.4,
  },
  {
    id: 'eggs',
    name: 'Eggs',
    quantity: 12,
    unit: 'unit',
    expiresInDays: 10,
    caloriesPerUnit: 78,
    proteinPerUnit: 6.3,
    fiberPerUnit: 0,
  },
  {
    id: 'oats',
    name: 'Oats',
    quantity: 300,
    unit: 'g',
    expiresInDays: 60,
    caloriesPerUnit: 389,
    proteinPerUnit: 16.9,
    fiberPerUnit: 10.6,
  },
  {
    id: 'banana',
    name: 'Banana',
    quantity: 6,
    unit: 'unit',
    expiresInDays: 2,
    caloriesPerUnit: 89,
    proteinPerUnit: 1.1,
    fiberPerUnit: 2.6,
  },
  {
    id: 'milk',
    name: 'Milk',
    quantity: 1,
    unit: 'L',
    expiresInDays: 3,
    caloriesPerUnit: 61,
    proteinPerUnit: 3.2,
    fiberPerUnit: 0,
  },
  {
    id: 'yogurt',
    name: 'Yogurt',
    quantity: 4,
    unit: 'unit',
    expiresInDays: 4,
    caloriesPerUnit: 59,
    proteinPerUnit: 10,
    fiberPerUnit: 0,
  },
  {
    id: 'broccoli',
    name: 'Broccoli',
    quantity: 300,
    unit: 'g',
    expiresInDays: 2,
    caloriesPerUnit: 34,
    proteinPerUnit: 2.8,
    fiberPerUnit: 2.6,
  },
  {
    id: 'potatoes',
    name: 'Potatoes',
    quantity: 700,
    unit: 'g',
    expiresInDays: 14,
    caloriesPerUnit: 77,
    proteinPerUnit: 2,
    fiberPerUnit: 2.2,
  },
  {
    id: 'tomatoes',
    name: 'Tomatoes',
    quantity: 400,
    unit: 'g',
    expiresInDays: 4,
    caloriesPerUnit: 18,
    proteinPerUnit: 0.9,
    fiberPerUnit: 1.2,
  },
];

const MAX_REQUESTS_PER_WINDOW = 5;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_GOAL_LENGTH = 240;

@Injectable()
export class DemoService {
  private readonly requests = new Map<string, readonly number[]>();

  getCatalog(): {
    readonly mode: 'guest-demo';
    readonly goals: DemoPlanResponse['goals'];
    readonly pantry: readonly DemoFood[];
    readonly limits: {
      readonly requestsPerHour: 5;
      readonly maxGoalLength: 240;
    };
  } {
    return {
      mode: 'guest-demo',
      goals: { calories: 2000, protein: 110, fiber: 30 },
      pantry: DEMO_FOODS,
      limits: {
        requestsPerHour: MAX_REQUESTS_PER_WINDOW,
        maxGoalLength: MAX_GOAL_LENGTH,
      },
    };
  }

  createPlan(goal: string, clientKey: string): DemoPlanResponse {
    const normalizedGoal = goal.trim();
    if (!normalizedGoal) throw new Error('goal is required.');
    if (normalizedGoal.length > MAX_GOAL_LENGTH)
      throw new Error(`goal must be at most ${MAX_GOAL_LENGTH} characters.`);
    this.consumeRateLimit(clientKey);
    const priority = [...DEMO_FOODS].sort(
      (left, right) => left.expiresInDays - right.expiresInDays,
    );
    const meals = [
      {
        mealType: 'breakfast',
        title: 'Oats with banana, milk and yogurt',
        foods: ['oats', 'banana', 'milk', 'yogurt'],
        calories: 520,
        protein: 28,
        fiber: 12,
      },
      {
        mealType: 'lunch',
        title: 'Chicken, rice, beans and broccoli',
        foods: ['chicken', 'rice', 'beans', 'broccoli'],
        calories: 690,
        protein: 52,
        fiber: 14,
      },
      {
        mealType: 'dinner',
        title: 'Eggs with potatoes and tomatoes',
        foods: ['eggs', 'potatoes', 'tomatoes'],
        calories: 510,
        protein: 29,
        fiber: 8,
      },
    ] as const;
    const used = new Set<string>(meals.flatMap((meal) => meal.foods));
    return {
      mode: 'guest-demo',
      goals: { calories: 2000, protein: 110, fiber: 30 },
      meals,
      pantry: priority,
      shoppingList: priority
        .filter((food) => !used.has(food.id) || food.quantity < 1)
        .map((food) => food.name),
      aiCalls: 0,
    };
  }

  private consumeRateLimit(clientKey: string): void {
    const now = Date.now();
    const recent = (this.requests.get(clientKey) ?? []).filter(
      (timestamp) => now - timestamp < WINDOW_MS,
    );
    if (recent.length >= MAX_REQUESTS_PER_WINDOW)
      throw new HttpException(
        'Guest demo rate limit exceeded.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    this.requests.set(clientKey, [...recent, now]);
  }
}
