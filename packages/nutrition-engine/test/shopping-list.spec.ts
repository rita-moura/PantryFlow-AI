import { generateShoppingList } from '../src/index';

describe('shopping list generation', () => {
  it('consolidates equal ingredients and subtracts pantry stock', () => {
    const list = generateShoppingList(
      [
        { foodId: 'tomato', foodName: 'Tomato', quantity: 200, unit: 'g' },
        { foodId: 'tomato', foodName: 'Tomato', quantity: 150, unit: 'g' },
      ],
      [{ foodId: 'tomato', quantity: 100, unit: 'g' }],
    );
    expect(list).toEqual([
      expect.objectContaining({
        foodId: 'tomato',
        quantity: 250,
        pantryQuantity: 100,
        reason: 'INSUFFICIENT_STOCK',
      }),
    ]);
  });

  it('supports compatible units and omits fully stocked ingredients', () => {
    const list = generateShoppingList(
      [
        { foodId: 'rice', quantity: 1, unit: 'kg' },
        { foodId: 'beans', quantity: 2, unit: 'unit' },
      ],
      [
        { foodId: 'rice', quantity: 500, unit: 'g' },
        { foodId: 'beans', quantity: 2, unit: 'unit' },
      ],
    );
    expect(list).toEqual([expect.objectContaining({ foodId: 'rice', quantity: 0.5, unit: 'kg' })]);
  });

  it('rejects incompatible units instead of silently mixing quantities', () => {
    expect(() =>
      generateShoppingList(
        [{ foodId: 'milk', quantity: 500, unit: 'ml' }],
        [{ foodId: 'milk', quantity: 1, unit: 'kg' }],
      ),
    ).toThrow();
  });
});
