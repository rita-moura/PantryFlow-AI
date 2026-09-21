import {
  foodNutrients,
  foods,
  nutritionGoals,
  pantryItems,
  pantryTransactions,
  profiles,
} from './schema';
import { database, pool } from './connection';

const LOCAL_PROFILE_ID = '00000000-0000-4000-8000-000000000001';
const LOCAL_GOAL_ID = '00000000-0000-4000-8000-000000000002';
const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';
const demoFoodRows = [
  ['10000000-0000-4000-8000-000000000001', 'Chicken', 'g', 'demo-chicken'],
  ['10000000-0000-4000-8000-000000000002', 'Rice', 'g', 'demo-rice'],
  ['10000000-0000-4000-8000-000000000003', 'Beans', 'g', 'demo-beans'],
  ['10000000-0000-4000-8000-000000000004', 'Eggs', 'unit', 'demo-eggs'],
  ['10000000-0000-4000-8000-000000000005', 'Oats', 'g', 'demo-oats'],
  ['10000000-0000-4000-8000-000000000006', 'Banana', 'unit', 'demo-banana'],
  ['10000000-0000-4000-8000-000000000007', 'Milk', 'L', 'demo-milk'],
  ['10000000-0000-4000-8000-000000000008', 'Yogurt', 'unit', 'demo-yogurt'],
  ['10000000-0000-4000-8000-000000000009', 'Broccoli', 'g', 'demo-broccoli'],
  ['10000000-0000-4000-8000-000000000010', 'Potatoes', 'g', 'demo-potatoes'],
  ['10000000-0000-4000-8000-000000000011', 'Tomatoes', 'g', 'demo-tomatoes'],
] as const;

async function seed(): Promise<void> {
  try {
    await database
      .insert(profiles)
      .values({ id: LOCAL_PROFILE_ID, displayName: 'Local Demo' })
      .onConflictDoNothing();

    await database
      .insert(nutritionGoals)
      .values({
        id: LOCAL_GOAL_ID,
        userId: LOCAL_PROFILE_ID,
        targetCalories: '2000',
        targetProteinG: '110',
        targetFiberG: '30',
        validFrom: '2026-01-01',
      })
      .onConflictDoNothing();

    await database
      .insert(foods)
      .values(
        demoFoodRows.map(([id, name, defaultUnit, externalId]) => ({
          id,
          name,
          source: 'DEMO',
          externalId,
          defaultUnit,
        })),
      )
      .onConflictDoNothing();

    await database
      .insert(foodNutrients)
      .values(
        demoFoodRows.map((row, index) => ({
          foodId: demoFoodRows[index][0],
          basisQuantity: '100',
          basisUnit: row[2],
          calories: [
            '165',
            '130',
            '127',
            '78',
            '389',
            '89',
            '61',
            '59',
            '34',
            '77',
            '18',
          ][index],
          proteinG: [
            '31',
            '2.7',
            '8.7',
            '6.3',
            '16.9',
            '1.1',
            '3.2',
            '10',
            '2.8',
            '2',
            '0.9',
          ][index],
          carbsG: [
            '0',
            '28',
            '23',
            '0.6',
            '66',
            '23',
            '4.8',
            '3.6',
            '7',
            '17',
            '3.9',
          ][index],
          fatG: [
            '3.6',
            '0.3',
            '0.5',
            '5.3',
            '6.9',
            '0.3',
            '3.3',
            '0.4',
            '0.4',
            '0.1',
            '0.2',
          ][index],
          fiberG: [
            '0',
            '0.4',
            '6.4',
            '0',
            '10.6',
            '2.6',
            '0',
            '0',
            '2.6',
            '2.2',
            '1.2',
          ][index],
        })),
      )
      .onConflictDoNothing();

    await database
      .insert(pantryItems)
      .values(
        demoFoodRows.map((row, index) => ({
          id: `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
          userId: DEMO_USER_ID,
          foodId: demoFoodRows[index][0],
          quantity: [
            '500',
            '500',
            '400',
            '12',
            '300',
            '6',
            '1',
            '4',
            '300',
            '700',
            '400',
          ][index],
          unit: row[2],
          purchaseDate: '2026-09-01',
          expirationDate: [
            '2026-09-22',
            '2026-10-21',
            '2026-09-26',
            '2026-10-01',
            '2026-11-20',
            '2026-09-23',
            '2026-09-24',
            '2026-09-25',
            '2026-09-23',
            '2026-10-05',
            '2026-09-25',
          ][index],
          minimumStock: '1',
        })),
      )
      .onConflictDoNothing();

    await database
      .insert(pantryTransactions)
      .values(
        demoFoodRows.map((row, index) => ({
          pantryItemId: `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
          userId: DEMO_USER_ID,
          type: 'PURCHASE' as const,
          quantityDelta: [
            '500',
            '500',
            '400',
            '12',
            '300',
            '6',
            '1',
            '4',
            '300',
            '700',
            '400',
          ][index],
          unit: row[2],
          reason: 'Guest demo seed',
        })),
      )
      .onConflictDoNothing();

    console.info('Database seed completed.');
  } finally {
    await pool.end();
  }
}

void seed();
