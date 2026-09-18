import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import type { RecipesRepository } from './recipes.repository';
import type { CreateRecipeData, RecipeRecord } from './recipes.types';

const foodId = '20000000-0000-4000-8000-000000000001';
const ownerId = '00000000-0000-4000-8000-000000000001';

const data: CreateRecipeData = {
  title: 'Protein oats',
  description: 'Oats with yogurt.',
  instructions: ['Mix ingredients.'],
  prepMinutes: 5,
  servings: 2,
  ingredients: [{ foodId, quantity: 100, unit: 'g' }],
};

const storedRecipe: RecipeRecord = {
  id: '30000000-0000-4000-8000-000000000001',
  ownerUserId: ownerId,
  title: data.title,
  description: data.description,
  instructions: data.instructions,
  prepMinutes: data.prepMinutes,
  cookMinutes: null,
  servings: 2,
  source: 'LOCAL',
  sourceUrl: null,
  ingredients: [
    {
      id: '40000000-0000-4000-8000-000000000001',
      foodId,
      foodName: 'Oats',
      quantity: 100,
      unit: 'g',
      optional: false,
      nutrition: {
        basisQuantity: 100,
        basisUnit: 'g',
        perBasis: {
          calories: 389,
          proteinG: 16.9,
          carbsG: 66.3,
          fatG: 6.9,
          fiberG: 10.6,
        },
      },
    },
  ],
  nutrition: {
    total: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
    perServing: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
    servings: 2,
  },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('RecipesService', () => {
  let repository: jest.Mocked<RecipesRepository>;
  let service: RecipesService;

  beforeEach(() => {
    repository = {
      create: jest.fn().mockResolvedValue(storedRecipe),
      findAll: jest.fn().mockResolvedValue([storedRecipe]),
      findById: jest.fn().mockResolvedValue(storedRecipe),
      foodIdsExist: jest.fn().mockResolvedValue(true),
    };
    service = new RecipesService(repository);
  });

  it('calculates total and per-serving nutrition from food facts', async () => {
    const recipe = await service.create(ownerId, data);
    expect(recipe.nutrition.total).toEqual({
      calories: 389,
      proteinG: 16.9,
      carbsG: 66.3,
      fatG: 6.9,
      fiberG: 10.6,
    });
    expect(recipe.nutrition.perServing).toEqual({
      calories: 194.5,
      proteinG: 8.45,
      carbsG: 33.15,
      fatG: 3.45,
      fiberG: 5.3,
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.create).toHaveBeenCalledWith(
      ownerId,
      data,
      expect.any(String),
    );
  });

  it('rejects recipes without ingredients or with unknown foods', async () => {
    await expect(
      service.create(ownerId, { ...data, ingredients: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    repository.foodIdsExist.mockResolvedValue(false);
    await expect(service.create(ownerId, data)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns not found for an inaccessible recipe', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(
      service.findById(ownerId, storedRecipe.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
