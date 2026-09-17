import { validateStockUpdate } from './pantry-stock-validation';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PantryRepository } from './pantry.repository';
import { PantryService } from './pantry.service';
import type {
  CreatePantryItemData,
  PantryItemRecord,
  PantryTransactionType,
  UpdatePantryItemData,
} from './pantry.types';

interface RecordedTransaction {
  readonly type: PantryTransactionType;
  readonly delta: number;
}

class InMemoryPantryRepository implements PantryRepository {
  readonly transactions: RecordedTransaction[] = [];
  readonly items = new Map<string, PantryItemRecord>();
  foodAvailable = true;

  findAll(userId: string): Promise<readonly PantryItemRecord[]> {
    return Promise.resolve(
      [...this.items.values()].filter((item) => item.userId === userId),
    );
  }

  findById(userId: string, id: string): Promise<PantryItemRecord | null> {
    const item = this.items.get(id);
    return Promise.resolve(item?.userId === userId ? item : null);
  }

  foodExists(): Promise<boolean> {
    return Promise.resolve(this.foodAvailable);
  }

  create(
    userId: string,
    data: CreatePantryItemData,
  ): Promise<PantryItemRecord> {
    const now = new Date('2026-08-27T12:00:00Z');
    const item: PantryItemRecord = {
      id: '10000000-0000-4000-8000-000000000001',
      userId,
      foodId: data.foodId,
      foodName: 'Rice',
      quantity: data.quantity,
      unit: data.unit,
      purchaseDate: data.purchaseDate ?? null,
      expirationDate: data.expirationDate ?? null,
      openedAt: data.openedAt ? new Date(data.openedAt) : null,
      minimumStock: data.minimumStock ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(item.id, item);
    this.transactions.push({ type: 'PURCHASE', delta: data.quantity });
    return Promise.resolve(item);
  }

  async update(
    userId: string,
    id: string,
    data: UpdatePantryItemData,
  ): Promise<PantryItemRecord | null> {
    const current = this.items.get(id);
    if (!current || current.userId !== userId) return Promise.resolve(null);
    validateStockUpdate(current, data);
    const quantity = data.quantity ?? current.quantity;
    if (quantity !== current.quantity && data.transactionType) {
      this.transactions.push({
        type: data.transactionType,
        delta: quantity - current.quantity,
      });
    }
    const updated: PantryItemRecord = {
      ...current,
      quantity,
      unit: data.unit ?? current.unit,
      purchaseDate:
        data.purchaseDate === undefined
          ? current.purchaseDate
          : data.purchaseDate,
      expirationDate:
        data.expirationDate === undefined
          ? current.expirationDate
          : data.expirationDate,
      openedAt:
        data.openedAt === undefined
          ? current.openedAt
          : data.openedAt === null
            ? null
            : new Date(data.openedAt),
      minimumStock:
        data.minimumStock === undefined
          ? current.minimumStock
          : data.minimumStock,
      updatedAt: new Date(),
    };
    this.items.set(id, updated);
    return Promise.resolve(updated);
  }

  remove(userId: string, id: string): Promise<boolean> {
    const current = this.items.get(id);
    if (!current || current.userId !== userId) return Promise.resolve(false);
    this.transactions.push({ type: 'WASTE', delta: -current.quantity });
    this.items.delete(id);
    return Promise.resolve(true);
  }
}

describe('PantryService', () => {
  const userId = '00000000-0000-4000-8000-000000000001';
  const foodId = '20000000-0000-4000-8000-000000000001';
  let repository: InMemoryPantryRepository;
  let service: PantryService;

  beforeEach(() => {
    repository = new InMemoryPantryRepository();
    service = new PantryService(repository);
  });

  async function createItem(quantity = 1000): Promise<PantryItemRecord> {
    return service.create(userId, { foodId, quantity, unit: 'g' });
  }

  it('creates stock and records a purchase transaction', async () => {
    const item = await createItem();
    expect(item.quantity).toBe(1000);
    expect(repository.transactions).toEqual([
      { type: 'PURCHASE', delta: 1000 },
    ]);
  });

  it('rejects an unknown food', async () => {
    repository.foodAvailable = false;
    await expect(createItem()).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reduces stock and records consumption', async () => {
    const item = await createItem();
    const updated = await service.update(userId, item.id, {
      quantity: 750,
      transactionType: 'CONSUMPTION',
      reason: 'Prepared lunch.',
    });
    expect(updated.quantity).toBe(750);
    expect(repository.transactions.at(-1)).toEqual({
      type: 'CONSUMPTION',
      delta: -250,
    });
  });

  it('never allows negative inventory', async () => {
    const item = await createItem();
    await expect(
      service.update(userId, item.id, {
        quantity: -1,
        transactionType: 'CONSUMPTION',
        reason: 'Invalid reduction.',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect((await repository.findById(userId, item.id))?.quantity).toBe(1000);
  });

  it('requires transaction metadata for every stock change', async () => {
    const item = await createItem();
    await expect(
      service.update(userId, item.id, { quantity: 900 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('enforces transaction direction', async () => {
    const item = await createItem();
    await expect(
      service.update(userId, item.id, {
        quantity: 1100,
        transactionType: 'WASTE',
        reason: 'Wrong direction.',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows metadata updates without creating stock transactions', async () => {
    const item = await createItem();
    await service.update(userId, item.id, { expirationDate: '2026-09-10' });
    expect(repository.transactions).toHaveLength(1);
  });

  it('does not reinterpret existing stock using a different unit', async () => {
    const item = await createItem();
    await expect(
      service.update(userId, item.id, { unit: 'kg' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('removes stock with a waste transaction and hides the item', async () => {
    const item = await createItem(250);
    await service.remove(userId, item.id);
    expect(repository.transactions.at(-1)).toEqual({
      type: 'WASTE',
      delta: -250,
    });
    await expect(service.remove(userId, item.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
