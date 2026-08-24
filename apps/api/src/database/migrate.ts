import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { database, pool } from './connection';

async function runMigrations(): Promise<void> {
  try {
    await migrate(database, { migrationsFolder: '../../drizzle' });
    console.info('Database migrations completed.');
  } finally {
    await pool.end();
  }
}

void runMigrations();
