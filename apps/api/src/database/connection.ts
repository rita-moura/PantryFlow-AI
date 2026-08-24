import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://pantryflow:pantryflow@localhost:5432/pantryflow';

export const pool = new Pool({ connectionString: databaseUrl });
export const database = drizzle(pool, { schema });
