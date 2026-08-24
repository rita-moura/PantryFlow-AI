import { nutritionGoals, profiles } from './schema';
import { database, pool } from './connection';

const LOCAL_PROFILE_ID = '00000000-0000-4000-8000-000000000001';
const LOCAL_GOAL_ID = '00000000-0000-4000-8000-000000000002';

async function seed(): Promise<void> {
  try {
    await database
      .insert(profiles)
      .values({ id: LOCAL_PROFILE_ID, displayName: 'Local Demo' })
      .onConflictDoNothing();

    await database
      .insert(nutritionGoals)
      .values({
        id: LOCAL_GOAL_ID,
        userId: LOCAL_PROFILE_ID,
        targetCalories: '2000',
        targetProteinG: '110',
        targetFiberG: '30',
        validFrom: '2026-01-01',
      })
      .onConflictDoNothing();

    console.info('Database seed completed.');
  } finally {
    await pool.end();
  }
}

void seed();
