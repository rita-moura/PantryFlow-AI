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
