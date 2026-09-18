import { Controller, Get, Query } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FoodsService } from './foods.service';
import type { FoodRecord } from './foods.types';

class SearchFoodsQuery {
  @IsString()
  query!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(25)
  limit = 10;
}

@Controller('foods')
export class FoodsController {
  constructor(private readonly service: FoodsService) {}

  @Get('search')
  search(@Query() query: SearchFoodsQuery): Promise<readonly FoodRecord[]> {
    return this.service.search(query.query, query.limit);
  }
}
