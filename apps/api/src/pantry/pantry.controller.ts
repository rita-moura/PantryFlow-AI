import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { PantryIdentityService } from './pantry-identity.service';
import { PantryService } from './pantry.service';
import type { PantryItemRecord } from './pantry.types';

@Controller('pantry')
export class PantryController {
  constructor(
    private readonly pantryService: PantryService,
    private readonly identity: PantryIdentityService,
  ) {}

  @Get()
  findAll(): Promise<readonly PantryItemRecord[]> {
    return this.pantryService.findAll(this.identity.getUserId());
  }

  @Post()
  create(@Body() data: CreatePantryItemDto): Promise<PantryItemRecord> {
    return this.pantryService.create(this.identity.getUserId(), data);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: UpdatePantryItemDto,
  ): Promise<PantryItemRecord> {
    return this.pantryService.update(this.identity.getUserId(), id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.pantryService.remove(this.identity.getUserId(), id);
  }
}
