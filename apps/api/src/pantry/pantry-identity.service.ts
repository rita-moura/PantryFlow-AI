import { Injectable, UnauthorizedException } from '@nestjs/common';

const SEEDED_LOCAL_PROFILE_ID = '00000000-0000-4000-8000-000000000001';

@Injectable()
export class PantryIdentityService {
  getUserId(): string {
    const configuredId = process.env.LOCAL_PROFILE_ID;
    if (configuredId) return configuredId;
    if (process.env.NODE_ENV !== 'production') return SEEDED_LOCAL_PROFILE_ID;
    throw new UnauthorizedException('Authenticated identity is required.');
  }
}
