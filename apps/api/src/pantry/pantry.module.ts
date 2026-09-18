import { Module } from '@nestjs/common';
import { PantryController } from './pantry.controller';
import { PantryIdentityService } from './pantry-identity.service';
import {
  DrizzlePantryRepository,
  PANTRY_REPOSITORY,
} from './pantry.repository';
import { PantryService } from './pantry.service';

@Module({
  controllers: [PantryController],
  providers: [
    PantryIdentityService,
    PantryService,
    { provide: PANTRY_REPOSITORY, useClass: DrizzlePantryRepository },
  ],
  exports: [PantryIdentityService],
})
export class PantryModule {}
