import { BadRequestException } from '@nestjs/common';
import type { UpdatePantryItemData } from './pantry.types';

/** Must be called against the current stock while holding the row lock. */
export function validateStockUpdate(
  current: { readonly quantity: number; readonly unit: string },
  data: UpdatePantryItemData,
): void {
  if (
    data.quantity !== undefined &&
    (!Number.isFinite(data.quantity) || data.quantity < 0)
  ) {
    throw new BadRequestException('Stock quantity cannot be negative.');
  }
  if (
    data.unit !== undefined &&
    data.unit !== current.unit &&
    (data.quantity ?? current.quantity) !== 0
  ) {
    throw new BadRequestException(
      'Stock unit can only be changed while quantity is zero.',
    );
  }

  if (data.quantity !== undefined && data.quantity !== current.quantity) {
    if (!data.transactionType || !data.reason?.trim()) {
      throw new BadRequestException(
        'transactionType and reason are required when changing stock quantity.',
      );
    }
    const delta = data.quantity - current.quantity;
    if (
      data.transactionType === 'CONSUMPTION' ||
      data.transactionType === 'WASTE'
    ) {
      if (delta >= 0) {
        throw new BadRequestException(
          `${data.transactionType} must reduce stock quantity.`,
        );
      }
    }
    if (data.transactionType === 'PURCHASE' && delta <= 0) {
      throw new BadRequestException('PURCHASE must increase stock quantity.');
    }
  }
}
