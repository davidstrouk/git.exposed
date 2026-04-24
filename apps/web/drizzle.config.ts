import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. For local dev, put it in apps/web/.env. For prod, ' +
      'pull it from your host (e.g. `vercel env pull .env.production.local`) and run with ' +
      '`node --env-file=.env.production.local node_modules/.bin/drizzle-kit migrate` from apps/web.',
  );
}

export default defineConfig({
  schema: '../../packages/shared/src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
