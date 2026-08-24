import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://pantryflow:pantryflow@localhost:5432/pantryflow';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema.ts',
  out: '../../drizzle',
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
});
