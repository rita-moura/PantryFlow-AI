import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  PANTRY_TRANSACTION_TYPES,
  type PantryTransactionType,
} from '../pantry.types';

export class UpdatePantryItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  unit?: string;

  @IsOptional()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsDateString()
  purchaseDate?: string | null;

  @IsOptional()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsDateString()
  expirationDate?: string | null;

  @IsOptional()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsDateString()
  openedAt?: string | null;

  @IsOptional()
  @ValidateIf((_object, value: unknown) => value !== null)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  minimumStock?: number | null;

  @IsOptional()
  @IsIn(PANTRY_TRANSACTION_TYPES)
  transactionType?: PantryTransactionType;

  @IsOptional()
  @IsString()
  reason?: string;
}
