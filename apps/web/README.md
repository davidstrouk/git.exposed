# @repo/web

Next.js App Router frontend for git.exposed. Deployed to Vercel.

> All `pnpm db:*` scripts below live in `apps/web/package.json`. Run them from `apps/web` (or invoke via `pnpm --filter @repo/web <script>` from repo root).

## Local development

Needs a Postgres instance. The simplest path:

1. Start a local Postgres container (from repo root):
   ```bash
   docker run --name gitexposed-pg -e POSTGRES_USER=gitexposed -e POSTGRES_PASSWORD=gitexposed \
     -e POSTGRES_DB=gitexposed -p 5433:5432 -d postgres:17
   ```
2. Create or edit `apps/web/.env` and set:
   ```
   DATABASE_URL=postgresql://gitexposed:gitexposed@localhost:5433/gitexposed
   ```
3. Apply schema:
   ```bash
   pnpm --filter @repo/web db:migrate
   ```
4. Start the dev server: `pnpm turbo dev` from repo root.

## Database migrations

Migration files live in `apps/web/drizzle/` and are tracked by `drizzle-kit` in the `drizzle.__drizzle_migrations` table on the target DB.

### Workflow

1. Change the schema in `packages/shared/src/db/schema-core.ts`.
2. Generate a migration file:
   ```bash
   pnpm --filter @repo/web db:generate --name=<short_description>
   ```
3. Commit both the schema change and the generated `*.sql` + `meta/*.json` files.
4. Apply to the target database (see below).

### Applying to local dev

```bash
pnpm --filter @repo/web db:migrate
```

Uses `apps/web/.env`'s `DATABASE_URL`.

### Applying to production

`drizzle-kit migrate` needs the **prod** `DATABASE_URL`. The safest pattern is to pull it from your host and run the migrator with an explicit env file so the var never ends up in a committed file:

```bash
cd apps/web
vercel env pull .env.production.local --environment=production
node --env-file=.env.production.local node_modules/.bin/drizzle-kit migrate
rm .env.production.local
```

`.env*` is gitignored (except `.env.example`). The migrator is idempotent — re-running it is a no-op once the latest migration is recorded in `__drizzle_migrations`.

> `node --env-file=` requires Node 20.6+. On older Node 20.x, use a dotenv runner instead:
> `pnpm dlx dotenv-cli -e .env.production.local -- drizzle-kit migrate`

### If `__drizzle_migrations` is out of sync

If the schema was bootstrapped some other way (e.g. `drizzle-kit push` or hand-run SQL), the tracking table may be empty or incomplete. Back-fill it with one row per already-applied migration before running `migrate`. From `apps/web`:

```ts
// Compute hash the same way drizzle-orm does:
// crypto.createHash('sha256').update(fs.readFileSync('drizzle/<tag>.sql').toString()).digest('hex')
// `created_at` = the `when` value from drizzle/meta/_journal.json for that entry
```

```sql
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES
  ('<sha256-of-0000.sql>', <when-from-journal>),
  ('<sha256-of-0001.sql>', <when-from-journal>);
```
