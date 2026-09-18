import { Module } from '@nestjs/common';
import { PantryModule } from '../pantry/pantry.module';
import { RecipesController } from './recipes.controller';
import {
  DrizzleRecipesRepository,
  RECIPES_REPOSITORY,
} from './recipes.repository';
import { RecipesService } from './recipes.service';

@Module({
  imports: [PantryModule],
  controllers: [RecipesController],
  providers: [
    RecipesService,
    { provide: RECIPES_REPOSITORY, useClass: DrizzleRecipesRepository },
  ],
})
export class RecipesModule {}
