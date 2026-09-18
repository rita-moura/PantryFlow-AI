import { Module } from '@nestjs/common';
import { FoodsController } from './foods.controller';
import { DrizzleFoodsRepository, FOODS_REPOSITORY } from './foods.repository';
import {
  OpenFoodFactsNutritionDataProvider,
  UsdaNutritionDataProvider,
} from './foods.providers';
import { FoodsService, NUTRITION_DATA_PROVIDERS } from './foods.service';

@Module({
  controllers: [FoodsController],
  providers: [
    FoodsService,
    { provide: FOODS_REPOSITORY, useClass: DrizzleFoodsRepository },
    {
      provide: NUTRITION_DATA_PROVIDERS,
      useFactory: () => [
        new UsdaNutritionDataProvider(),
        new OpenFoodFactsNutritionDataProvider(),
      ],
    },
  ],
  exports: [FoodsService],
})
export class FoodsModule {}
