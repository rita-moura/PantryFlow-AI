import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { FOODS_REPOSITORY, type FoodsRepository } from './foods.repository';
import type { FoodRecord, NutritionDataProvider } from './foods.types';

export const NUTRITION_DATA_PROVIDERS = Symbol('NUTRITION_DATA_PROVIDERS');

@Injectable()
export class FoodsService {
  private readonly logger = new Logger(FoodsService.name);
  constructor(
    @Inject(FOODS_REPOSITORY) private readonly repository: FoodsRepository,
    @Inject(NUTRITION_DATA_PROVIDERS)
    private readonly providers: readonly NutritionDataProvider[],
  ) {}

  async search(query: string, limit = 10): Promise<readonly FoodRecord[]> {
    const normalized = query.trim();
    if (normalized.length < 2)
      throw new BadRequestException(
        'Search query must have at least 2 characters.',
      );
    const safeLimit = Math.min(Math.max(limit, 1), 25);
    const local = await this.repository.search(normalized, safeLimit);
    if (local.length > 0) return local;

    for (const provider of this.providers) {
      try {
        const results = await provider.search(normalized, safeLimit);
        if (results.length === 0) continue;
        const persisted = [];
        for (const food of results)
          persisted.push(await this.repository.save(food));
        return persisted;
      } catch {
        this.logger.warn(
          `${provider.source} search failed; trying next provider.`,
        );
      }
    }
    return [];
  }
}
