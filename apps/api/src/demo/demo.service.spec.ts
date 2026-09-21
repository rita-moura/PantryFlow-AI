import { HttpException } from '@nestjs/common';
import { DemoService } from './demo.service';

describe('DemoService', () => {
  it('returns the seeded catalog and fixed demo goals', () => {
    const service = new DemoService();
    const catalog = service.getCatalog();
    expect(catalog.goals).toEqual({ calories: 2000, protein: 110, fiber: 30 });
    expect(catalog.pantry.map((food) => food.name)).toEqual([
      'Chicken',
      'Rice',
      'Beans',
      'Eggs',
      'Oats',
      'Banana',
      'Milk',
      'Yogurt',
      'Broccoli',
      'Potatoes',
      'Tomatoes',
    ]);
  });

  it('creates a pantry-first plan without making AI calls', () => {
    const service = new DemoService();
    const result = service.createPlan(
      'Monte meu cardápio usando primeiro os alimentos próximos do vencimento.',
      'guest-1',
    );
    expect(result.mode).toBe('guest-demo');
    expect(result.meals).toHaveLength(3);
    expect(result.aiCalls).toBe(0);
    expect(result.pantry[0]?.name).toBe('Chicken');
  });

  it('limits guest requests and rejects oversized goals', () => {
    const service = new DemoService();
    for (let index = 0; index < 5; index += 1)
      service.createPlan('demo', 'guest-1');
    expect(() => service.createPlan('demo', 'guest-1')).toThrow(HttpException);
    expect(() => service.createPlan('x'.repeat(241), 'guest-2')).toThrow(
      '240 characters',
    );
  });
});
