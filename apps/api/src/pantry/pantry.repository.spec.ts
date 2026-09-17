import { BadRequestException } from '@nestjs/common';
import { database } from '../database/connection';
import { DrizzlePantryRepository } from './pantry.repository';
import { PantryService } from './pantry.service';
import type { UpdatePantryItemData } from './pantry.types';

jest.mock('../database/connection', () => ({
  database: { transaction: jest.fn() },
}));

describe('Pantry stock validation under the row lock', () => {
  const userId = '00000000-0000-4000-8000-000000000001';
  const itemId = '10000000-0000-4000-8000-000000000001';

  function setup(quantity: number, unit = 'g') {
    const limit = jest
      .fn()
      .mockResolvedValue([{ quantity: String(quantity), unit }]);
    const lock = jest.fn().mockReturnValue({ limit });
    const where = jest.fn().mockReturnValue({ for: lock });
    const from = jest.fn().mockReturnValue({ where });
    const update = jest.fn().mockReturnValue({
      set: jest
        .fn()
        .mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
    });
    const values = jest.fn().mockResolvedValue(undefined);
    const transaction = {
      select: jest.fn().mockReturnValue({ from }),
      update,
      insert: jest.fn().mockReturnValue({ values }),
    };
    jest
      .spyOn(database, 'transaction')
      .mockImplementation(async (callback) =>
        callback(
          transaction as unknown as Parameters<
            Parameters<typeof database.transaction>[0]
          >[0],
        ),
      );
    const repository = new DrizzlePantryRepository();
    const read = jest.spyOn(repository, 'findById').mockResolvedValue(null);
    return {
      service: new PantryService(repository),
      lock,
      update,
      transaction,
      values,
      read,
    };
  }

  it.each<{ name: string; quantity: number; data: UpdatePantryItemData }>([
    {
      name: 'a former no-op that would now change stock without history',
      quantity: 750,
      data: { quantity: 1000 },
    },
    {
      name: 'consumption that would increase the latest stock',
      quantity: 500,
      data: { quantity: 750, transactionType: 'CONSUMPTION', reason: 'Lunch' },
    },
    {
      name: 'waste that would increase the latest stock',
      quantity: 500,
      data: { quantity: 750, transactionType: 'WASTE', reason: 'Expired' },
    },
    {
      name: 'a purchase that would decrease the latest stock',
      quantity: 1500,
      data: { quantity: 1100, transactionType: 'PURCHASE', reason: 'Restock' },
    },
    {
      name: 'a unit change after another request added stock',
      quantity: 100,
      data: { unit: 'kg' },
    },
    {
      name: 'negative stock',
      quantity: 100,
      data: { quantity: -1, transactionType: 'ADJUSTMENT', reason: 'Count' },
    },
    {
      name: 'a stock change with a blank reason',
      quantity: 100,
      data: { quantity: 50, transactionType: 'CONSUMPTION', reason: ' ' },
    },
  ])('rejects $name before writing', async ({ quantity, data }) => {
    const { service, lock, update, transaction, read } = setup(quantity);
    await expect(service.update(userId, itemId, data)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(lock).toHaveBeenCalledWith('update');
    expect(update).not.toHaveBeenCalled();
    expect(transaction.insert).not.toHaveBeenCalled();
    expect(read).not.toHaveBeenCalled();
  });

  it('records the delta from the locked stock rather than an earlier value', async () => {
    const { service, update, values, read } = setup(800);
    read.mockResolvedValue({ id: itemId } as Awaited<
      ReturnType<DrizzlePantryRepository['findById']>
    >);
    await service.update(userId, itemId, {
      quantity: 750,
      transactionType: 'CONSUMPTION',
      reason: 'Lunch',
    });
    expect(update).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        quantityDelta: '-50',
        type: 'CONSUMPTION',
        unit: 'g',
      }),
    );
    expect(read).toHaveBeenCalledTimes(1);
  });
});
