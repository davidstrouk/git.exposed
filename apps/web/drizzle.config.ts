import { defineConfig } from 'drizzle-kit';

// Commands that need to connect to the DB. `generate`, `check`, `up`, `drop`
// are file-only and don't need DATABASE_URL.
const CONNECTION_COMMANDS = new Set(['migrate', 'push', 'pull', 'studio', 'introspect']);
const needsConnection = process.argv.some((arg) => CONNECTION_COMMANDS.has(arg));

const databaseUrl = process.env.DATABASE_URL;
if (needsConnection && !databaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. For local dev, put it in apps/web/.env. For prod, ' +
      'pull it from your host (e.g. `vercel env pull .env.production.local --environment=production`) ' +
      'and run with `node --env-file=.env.production.local node_modules/.bin/drizzle-kit migrate` ' +
      'from apps/web (requires Node 20.6+).',
  );
}

export default defineConfig({
  schema: '../../packages/shared/src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl ?? '',
  },
});
