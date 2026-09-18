import { eq, ilike, or } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { database } from '../database/connection';
import { foodNutrients, foods } from '../database/schema';
import type { FoodRecord, NormalizedFood } from './foods.types';

export const FOODS_REPOSITORY = Symbol('FOODS_REPOSITORY');

export interface FoodsRepository {
  search(query: string, limit: number): Promise<readonly FoodRecord[]>;
  save(food: NormalizedFood): Promise<FoodRecord>;
}

type FoodRow = {
  readonly id: string;
  readonly name: string;
  readonly brand: string | null;
  readonly source: string;
  readonly externalId: string | null;
  readonly defaultUnit: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly basisQuantity: string;
  readonly basisUnit: string;
  readonly calories: string;
  readonly proteinG: string;
  readonly carbsG: string;
  readonly fatG: string;
  readonly fiberG: string;
  readonly metadata: unknown;
};

function mapFood(row: FoodRow): FoodRecord {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    source: row.source as FoodRecord['source'],
    externalId: row.externalId ?? '',
    defaultUnit: row.defaultUnit,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    nutrition: {
      basisQuantity: Number(row.basisQuantity),
      basisUnit: row.basisUnit,
      calories: Number(row.calories),
      proteinG: Number(row.proteinG),
      carbsG: Number(row.carbsG),
      fatG: Number(row.fatG),
      fiberG: Number(row.fiberG),
      metadata: (row.metadata ?? {}) as Readonly<Record<string, unknown>>,
    },
  };
}

@Injectable()
export class DrizzleFoodsRepository implements FoodsRepository {
  async search(query: string, limit: number): Promise<readonly FoodRecord[]> {
    const pattern = `%${query}%`;
    const rows = await database
      .select({
        id: foods.id,
        name: foods.name,
        brand: foods.brand,
        source: foods.source,
        externalId: foods.externalId,
        defaultUnit: foods.defaultUnit,
        createdAt: foods.createdAt,
        updatedAt: foods.updatedAt,
        basisQuantity: foodNutrients.basisQuantity,
        basisUnit: foodNutrients.basisUnit,
        calories: foodNutrients.calories,
        proteinG: foodNutrients.proteinG,
        carbsG: foodNutrients.carbsG,
        fatG: foodNutrients.fatG,
        fiberG: foodNutrients.fiberG,
        metadata: foodNutrients.metadata,
      })
      .from(foods)
      .innerJoin(foodNutrients, eq(foodNutrients.foodId, foods.id))
      .where(or(ilike(foods.name, pattern), ilike(foods.brand, pattern)))
      .limit(limit);
    return rows.map((row) => mapFood(row));
  }

  async save(food: NormalizedFood): Promise<FoodRecord> {
    return database.transaction(async (transaction) => {
      const [inserted] = await transaction
        .insert(foods)
        .values({
          name: food.name,
          brand: food.brand,
          source: food.source,
          externalId: food.externalId,
          defaultUnit: food.defaultUnit,
        })
        .onConflictDoUpdate({
          target: [foods.source, foods.externalId],
          set: {
            name: food.name,
            brand: food.brand,
            defaultUnit: food.defaultUnit,
            updatedAt: new Date(),
          },
        })
        .returning();
      if (!inserted) throw new Error('Food could not be persisted.');

      const [nutrient] = await transaction
        .insert(foodNutrients)
        .values({
          foodId: inserted.id,
          basisQuantity: String(food.nutrition.basisQuantity),
          basisUnit: food.nutrition.basisUnit,
          calories: String(food.nutrition.calories),
          proteinG: String(food.nutrition.proteinG),
          carbsG: String(food.nutrition.carbsG),
          fatG: String(food.nutrition.fatG),
          fiberG: String(food.nutrition.fiberG),
          metadata: food.nutrition.metadata ?? {},
        })
        .onConflictDoUpdate({
          target: foodNutrients.foodId,
          set: {
            basisQuantity: String(food.nutrition.basisQuantity),
            basisUnit: food.nutrition.basisUnit,
            calories: String(food.nutrition.calories),
            proteinG: String(food.nutrition.proteinG),
            carbsG: String(food.nutrition.carbsG),
            fatG: String(food.nutrition.fatG),
            fiberG: String(food.nutrition.fiberG),
            metadata: food.nutrition.metadata ?? {},
          },
        })
        .returning();
      if (!nutrient) throw new Error('Food nutrition could not be persisted.');
      return mapFood({ ...inserted, ...nutrient });
    });
  }
}
