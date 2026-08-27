import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PANTRY_REPOSITORY, type PantryRepository } from './pantry.repository';
import type {
  CreatePantryItemData,
  PantryItemRecord,
  UpdatePantryItemData,
} from './pantry.types';

@Injectable()
export class PantryService {
  constructor(
    @Inject(PANTRY_REPOSITORY) private readonly repository: PantryRepository,
  ) {}

  findAll(userId: string): Promise<readonly PantryItemRecord[]> {
    return this.repository.findAll(userId);
  }

  async create(
    userId: string,
    data: CreatePantryItemData,
  ): Promise<PantryItemRecord> {
    if (!Number.isFinite(data.quantity) || data.quantity <= 0) {
      throw new BadRequestException(
        'Initial stock quantity must be greater than zero.',
      );
    }
    if (!(await this.repository.foodExists(data.foodId))) {
      throw new BadRequestException('Food does not exist.');
    }
    return this.repository.create(userId, data);
  }

  async update(
    userId: string,
    id: string,
    data: UpdatePantryItemData,
  ): Promise<PantryItemRecord> {
    const current = await this.repository.findById(userId, id);
    if (!current) throw new NotFoundException('Pantry item not found.');

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

    const updated = await this.repository.update(userId, id, data);
    if (!updated) throw new NotFoundException('Pantry item not found.');
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    if (!(await this.repository.remove(userId, id))) {
      throw new NotFoundException('Pantry item not found.');
    }
  }
}
