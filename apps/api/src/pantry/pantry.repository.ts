import { and, eq, isNull } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { database } from '../database/connection';
import { foods, pantryItems, pantryTransactions } from '../database/schema';
import type {
  CreatePantryItemData,
  PantryItemRecord,
  UpdatePantryItemData,
} from './pantry.types';

export const PANTRY_REPOSITORY = Symbol('PANTRY_REPOSITORY');

export interface PantryRepository {
  findAll(userId: string): Promise<readonly PantryItemRecord[]>;
  findById(userId: string, id: string): Promise<PantryItemRecord | null>;
  foodExists(foodId: string): Promise<boolean>;
  create(userId: string, data: CreatePantryItemData): Promise<PantryItemRecord>;
  update(
    userId: string,
    id: string,
    data: UpdatePantryItemData,
  ): Promise<PantryItemRecord | null>;
  remove(userId: string, id: string): Promise<boolean>;
}

const selection = {
  id: pantryItems.id,
  userId: pantryItems.userId,
  foodId: pantryItems.foodId,
  foodName: foods.name,
  quantity: pantryItems.quantity,
  unit: pantryItems.unit,
  purchaseDate: pantryItems.purchaseDate,
  expirationDate: pantryItems.expirationDate,
  openedAt: pantryItems.openedAt,
  minimumStock: pantryItems.minimumStock,
  createdAt: pantryItems.createdAt,
  updatedAt: pantryItems.updatedAt,
};

type SelectedItem = Omit<PantryItemRecord, 'quantity' | 'minimumStock'> & {
  readonly quantity: string;
  readonly minimumStock: string | null;
};

function mapItem(item: SelectedItem): PantryItemRecord {
  return {
    ...item,
    quantity: Number(item.quantity),
    minimumStock: item.minimumStock === null ? null : Number(item.minimumStock),
  };
}

@Injectable()
export class DrizzlePantryRepository implements PantryRepository {
  async findAll(userId: string): Promise<readonly PantryItemRecord[]> {
    const rows = await database
      .select(selection)
      .from(pantryItems)
      .innerJoin(foods, eq(pantryItems.foodId, foods.id))
      .where(and(eq(pantryItems.userId, userId), isNull(pantryItems.deletedAt)))
      .orderBy(pantryItems.expirationDate, pantryItems.createdAt);
    return rows.map(mapItem);
  }

  async findById(userId: string, id: string): Promise<PantryItemRecord | null> {
    const [row] = await database
      .select(selection)
      .from(pantryItems)
      .innerJoin(foods, eq(pantryItems.foodId, foods.id))
      .where(
        and(
          eq(pantryItems.id, id),
          eq(pantryItems.userId, userId),
          isNull(pantryItems.deletedAt),
        ),
      )
      .limit(1);
    return row ? mapItem(row) : null;
  }

  async foodExists(foodId: string): Promise<boolean> {
    const [row] = await database
      .select({ id: foods.id })
      .from(foods)
      .where(eq(foods.id, foodId))
      .limit(1);
    return row !== undefined;
  }

  async create(
    userId: string,
    data: CreatePantryItemData,
  ): Promise<PantryItemRecord> {
    const id = await database.transaction(async (transaction) => {
      const [created] = await transaction
        .insert(pantryItems)
        .values({
          userId,
          foodId: data.foodId,
          quantity: String(data.quantity),
          unit: data.unit,
          purchaseDate: data.purchaseDate,
          expirationDate: data.expirationDate,
          openedAt: data.openedAt ? new Date(data.openedAt) : undefined,
          minimumStock:
            data.minimumStock === undefined
              ? undefined
              : String(data.minimumStock),
        })
        .returning({ id: pantryItems.id });
      if (!created)
        throw new Error('Database did not return the created pantry item.');

      await transaction.insert(pantryTransactions).values({
        pantryItemId: created.id,
        userId,
        type: 'PURCHASE',
        quantityDelta: String(data.quantity),
        unit: data.unit,
        reason: 'Initial pantry stock.',
      });
      return created.id;
    });

    const created = await this.findById(userId, id);
    if (!created) throw new Error('Created pantry item could not be loaded.');
    return created;
  }

  async update(
    userId: string,
    id: string,
    data: UpdatePantryItemData,
  ): Promise<PantryItemRecord | null> {
    const updated = await database.transaction(async (transaction) => {
      const [current] = await transaction
        .select({ quantity: pantryItems.quantity, unit: pantryItems.unit })
        .from(pantryItems)
        .where(
          and(
            eq(pantryItems.id, id),
            eq(pantryItems.userId, userId),
            isNull(pantryItems.deletedAt),
          ),
        )
        .for('update')
        .limit(1);
      if (!current) return false;

      const currentQuantity = Number(current.quantity);
      const nextQuantity = data.quantity ?? currentQuantity;
      const delta = nextQuantity - currentQuantity;

      await transaction
        .update(pantryItems)
        .set({
          quantity:
            data.quantity === undefined ? undefined : String(data.quantity),
          unit: data.unit,
          purchaseDate: data.purchaseDate,
          expirationDate: data.expirationDate,
          openedAt:
            data.openedAt === undefined
              ? undefined
              : data.openedAt === null
                ? null
                : new Date(data.openedAt),
          minimumStock:
            data.minimumStock === undefined
              ? undefined
              : data.minimumStock === null
                ? null
                : String(data.minimumStock),
          updatedAt: new Date(),
        })
        .where(eq(pantryItems.id, id));

      if (delta !== 0 && data.transactionType && data.reason) {
        await transaction.insert(pantryTransactions).values({
          pantryItemId: id,
          userId,
          type: data.transactionType,
          quantityDelta: String(delta),
          unit:
            currentQuantity > 0 ? current.unit : (data.unit ?? current.unit),
          reason: data.reason,
        });
      }
      return true;
    });

    return updated ? this.findById(userId, id) : null;
  }

  async remove(userId: string, id: string): Promise<boolean> {
    return database.transaction(async (transaction) => {
      const [current] = await transaction
        .select({ quantity: pantryItems.quantity, unit: pantryItems.unit })
        .from(pantryItems)
        .where(
          and(
            eq(pantryItems.id, id),
            eq(pantryItems.userId, userId),
            isNull(pantryItems.deletedAt),
          ),
        )
        .for('update')
        .limit(1);
      if (!current) return false;

      await transaction.insert(pantryTransactions).values({
        pantryItemId: id,
        userId,
        type: 'WASTE',
        quantityDelta: String(-Number(current.quantity)),
        unit: current.unit,
        reason: 'Pantry item removed.',
      });
      await transaction
        .update(pantryItems)
        .set({ quantity: '0', deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(pantryItems.id, id));
      return true;
    });
  }
}
