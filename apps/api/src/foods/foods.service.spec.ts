import { BadRequestException } from '@nestjs/common';
import { FoodsService } from './foods.service';
import type {
  FoodRecord,
  NormalizedFood,
  NutritionDataProvider,
} from './foods.types';
import type { FoodsRepository } from './foods.repository';

const result: NormalizedFood = {
  name: 'Chickpeas',
  brand: null,
  source: 'USDA',
  externalId: '123',
  defaultUnit: 'g',
  nutrition: {
    basisQuantity: 100,
    basisUnit: 'g',
    calories: 164,
    proteinG: 8.9,
    carbsG: 27.4,
    fatG: 2.6,
    fiberG: 7.6,
  },
};

function record(food: NormalizedFood): FoodRecord {
  const now = new Date();
  return { ...food, id: 'food-id', createdAt: now, updatedAt: now };
}

describe('FoodsService', () => {
  let repository: jest.Mocked<FoodsRepository>;
  let provider: jest.Mocked<NutritionDataProvider>;

  beforeEach(() => {
    repository = { search: jest.fn(), save: jest.fn() };
    provider = { source: 'USDA', search: jest.fn() };
  });

  it('returns local foods without calling external providers', async () => {
    repository.search.mockResolvedValue([record(result)]);
    const service = new FoodsService(repository, [provider]);

    await expect(service.search('chickpeas')).resolves.toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(provider.search).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('normalizes the query, calls a provider on a local miss, and persists results', async () => {
    repository.search.mockResolvedValue([]);
    provider.search.mockResolvedValue([result]);
    repository.save.mockResolvedValue(record(result));
    const service = new FoodsService(repository, [provider]);

    await expect(service.search('  chickpeas  ', 100)).resolves.toEqual([
      expect.objectContaining({ name: 'Chickpeas', id: 'food-id' }),
    ]);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(provider.search).toHaveBeenCalledWith('chickpeas', 25);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.save).toHaveBeenCalledWith(result);
  });

  it('tries the next provider when one provider fails', async () => {
    const fallback: jest.Mocked<NutritionDataProvider> = {
      source: 'OPEN_FOOD_FACTS',
      search: jest.fn().mockResolvedValue([result]),
    };
    repository.search.mockResolvedValue([]);
    provider.search.mockRejectedValue(new Error('timeout'));
    repository.save.mockResolvedValue(record(result));
    const service = new FoodsService(repository, [provider, fallback]);

    await expect(service.search('beans')).resolves.toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(fallback.search).toHaveBeenCalled();
  });

  it('rejects queries shorter than two characters', async () => {
    const service = new FoodsService(repository, [provider]);
    await expect(service.search('a')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
