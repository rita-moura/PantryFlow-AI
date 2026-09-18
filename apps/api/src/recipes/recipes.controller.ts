import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PantryIdentityService } from '../pantry/pantry-identity.service';
import { RecipesService } from './recipes.service';
import type { RecipeRecord } from './recipes.types';

class CreateRecipeIngredientDto {
  @IsUUID()
  foodId!: string;
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity!: number;
  @IsString()
  @IsNotEmpty()
  unit!: string;
  @IsOptional()
  @IsBoolean()
  optional?: boolean;
}

class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  title!: string;
  @IsString()
  description!: string;
  @IsArray()
  @IsString({ each: true })
  instructions!: string[];
  @Type(() => Number)
  @IsInt()
  @Min(0)
  prepMinutes!: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  cookMinutes?: number;
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  servings!: number;
  @IsOptional()
  @IsString()
  source?: string;
  @IsOptional()
  @IsString()
  sourceUrl?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientDto)
  ingredients!: CreateRecipeIngredientDto[];
}

@Controller('recipes')
export class RecipesController {
  constructor(
    private readonly service: RecipesService,
    private readonly identity: PantryIdentityService,
  ) {}

  @Get()
  findAll(): Promise<readonly RecipeRecord[]> {
    return this.service.findAll(this.identity.getUserId());
  }

  @Get(':id')
  findById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<RecipeRecord> {
    return this.service.findById(this.identity.getUserId(), id);
  }

  @Post()
  create(@Body() data: CreateRecipeDto): Promise<RecipeRecord> {
    return this.service.create(this.identity.getUserId(), data);
  }
}
