import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  calculateRecipeNutrition,
  type FoodNutritionInput,
} from '@pantryflow/nutrition-engine';
import {
  RECIPES_REPOSITORY,
  type RecipesRepository,
} from './recipes.repository';
import type { CreateRecipeData, RecipeRecord } from './recipes.types';

@Injectable()
export class RecipesService {
  constructor(
    @Inject(RECIPES_REPOSITORY) private readonly repository: RecipesRepository,
  ) {}

  async create(
    ownerUserId: string,
    data: CreateRecipeData,
  ): Promise<RecipeRecord> {
    if (data.ingredients.length === 0) {
      throw new BadRequestException(
        'A recipe must contain at least one ingredient.',
      );
    }
    const foodIds = data.ingredients.map((ingredient) => ingredient.foodId);
    if (!(await this.repository.foodIdsExist(foodIds))) {
      throw new BadRequestException(
        'Every recipe ingredient must reference an existing food.',
      );
    }
    const contentHash = createHash('sha256')
      .update(JSON.stringify({ ...data, ownerUserId }))
      .digest('hex');
    const created = await this.repository.create(
      ownerUserId,
      data,
      contentHash,
    );
    return this.findById(ownerUserId, created.id);
  }

  async findAll(ownerUserId: string): Promise<readonly RecipeRecord[]> {
    const recipes = await this.repository.findAll(ownerUserId);
    return Promise.all(
      recipes.map((recipe) => this.findById(ownerUserId, recipe.id)),
    );
  }

  async findById(ownerUserId: string, id: string): Promise<RecipeRecord> {
    const recipe = await this.repository.findById(ownerUserId, id);
    if (!recipe) throw new NotFoundException('Recipe not found.');
    const ingredients: FoodNutritionInput[] = recipe.ingredients.map(
      (ingredient) => ({
        basisQuantity: ingredient.nutrition.basisQuantity,
        basisUnit: ingredient.nutrition.basisUnit,
        nutritionPerBasis: ingredient.nutrition.perBasis,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
      }),
    );
    return {
      ...recipe,
      nutrition: calculateRecipeNutrition(ingredients, recipe.servings),
    };
  }
}
