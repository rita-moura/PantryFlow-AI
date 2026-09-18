import { and, eq } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { database } from '../database/connection';
import {
  foodNutrients,
  foods,
  recipeIngredients,
  recipes,
} from '../database/schema';
import type { CreateRecipeData, RecipeRecord } from './recipes.types';

export const RECIPES_REPOSITORY = Symbol('RECIPES_REPOSITORY');

export interface RecipesRepository {
  create(
    ownerUserId: string,
    data: CreateRecipeData,
    contentHash: string,
  ): Promise<RecipeRecord>;
  findAll(ownerUserId: string): Promise<readonly RecipeRecord[]>;
  findById(ownerUserId: string, id: string): Promise<RecipeRecord | null>;
  foodIdsExist(foodIds: readonly string[]): Promise<boolean>;
}

@Injectable()
export class DrizzleRecipesRepository implements RecipesRepository {
  async foodIdsExist(foodIds: readonly string[]): Promise<boolean> {
    if (foodIds.length === 0) return false;
    const rows = await database.select({ id: foods.id }).from(foods);
    const existing = new Set(rows.map((row) => row.id));
    return foodIds.every((id) => existing.has(id));
  }

  async create(
    ownerUserId: string,
    data: CreateRecipeData,
    contentHash: string,
  ): Promise<RecipeRecord> {
    const id = await database.transaction(async (transaction) => {
      const [recipe] = await transaction
        .insert(recipes)
        .values({
          ownerUserId,
          title: data.title,
          description: data.description,
          instructions: [...data.instructions],
          prepMinutes: data.prepMinutes,
          cookMinutes: data.cookMinutes,
          servings: String(data.servings),
          source: data.source ?? 'LOCAL',
          sourceUrl: data.sourceUrl,
          contentHash,
        })
        .returning({ id: recipes.id });
      if (!recipe) throw new Error('Recipe could not be persisted.');
      await transaction.insert(recipeIngredients).values(
        data.ingredients.map((ingredient, position) => ({
          recipeId: recipe.id,
          foodId: ingredient.foodId,
          quantity: String(ingredient.quantity),
          unit: ingredient.unit,
          optional: ingredient.optional ?? false,
          position,
        })),
      );
      return recipe.id;
    });
    const created = await this.findById(ownerUserId, id);
    if (!created) throw new Error('Created recipe could not be loaded.');
    return created;
  }

  async findAll(ownerUserId: string): Promise<readonly RecipeRecord[]> {
    const rows = await database
      .select({ id: recipes.id })
      .from(recipes)
      .where(and(eq(recipes.ownerUserId, ownerUserId)));
    const results: RecipeRecord[] = [];
    for (const row of rows) {
      const recipe = await this.findById(ownerUserId, row.id);
      if (recipe) results.push(recipe);
    }
    return results;
  }

  async findById(
    ownerUserId: string,
    id: string,
  ): Promise<RecipeRecord | null> {
    const [recipe] = await database
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.ownerUserId, ownerUserId)))
      .limit(1);
    if (!recipe) return null;
    const ingredients = await database
      .select({
        id: recipeIngredients.id,
        foodId: recipeIngredients.foodId,
        foodName: foods.name,
        quantity: recipeIngredients.quantity,
        unit: recipeIngredients.unit,
        optional: recipeIngredients.optional,
        basisQuantity: foodNutrients.basisQuantity,
        basisUnit: foodNutrients.basisUnit,
        calories: foodNutrients.calories,
        proteinG: foodNutrients.proteinG,
        carbsG: foodNutrients.carbsG,
        fatG: foodNutrients.fatG,
        fiberG: foodNutrients.fiberG,
      })
      .from(recipeIngredients)
      .innerJoin(foods, eq(recipeIngredients.foodId, foods.id))
      .innerJoin(foodNutrients, eq(foodNutrients.foodId, foods.id))
      .where(eq(recipeIngredients.recipeId, id));
    return {
      id: recipe.id,
      ownerUserId: recipe.ownerUserId,
      title: recipe.title,
      description: recipe.description,
      instructions: recipe.instructions as readonly string[],
      prepMinutes: recipe.prepMinutes,
      cookMinutes: recipe.cookMinutes,
      servings: Number(recipe.servings),
      source: recipe.source,
      sourceUrl: recipe.sourceUrl,
      ingredients: ingredients.map((ingredient) => ({
        id: ingredient.id,
        foodId: ingredient.foodId,
        foodName: ingredient.foodName,
        quantity: Number(ingredient.quantity),
        unit: ingredient.unit,
        optional: ingredient.optional,
        nutrition: {
          basisQuantity: Number(ingredient.basisQuantity),
          basisUnit: ingredient.basisUnit,
          perBasis: {
            calories: Number(ingredient.calories),
            proteinG: Number(ingredient.proteinG),
            carbsG: Number(ingredient.carbsG),
            fatG: Number(ingredient.fatG),
            fiberG: Number(ingredient.fiberG),
          },
        },
      })),
      nutrition: {
        total: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
        perServing: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
        servings: Number(recipe.servings),
      },
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    };
  }
}
