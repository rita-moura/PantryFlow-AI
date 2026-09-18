import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PantryModule } from './pantry/pantry.module';
import { FoodsModule } from './foods/foods.module';
import { RecipesModule } from './recipes/recipes.module';

@Module({
  imports: [PantryModule, FoodsModule, RecipesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
