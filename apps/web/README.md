# @repo/web

Next.js App Router frontend for git.exposed. Deployed to Vercel.

## Local development

Needs a Postgres instance. The simplest path:

```bash
# From repo root
docker run --name gitexposed-pg -e POSTGRES_USER=gitexposed -e POSTGRES_PASSWORD=gitexposed \
  -e POSTGRES_DB=gitexposed -p 5433:5432 -d postgres:17

# In apps/web/.env
echo "DATABASE_URL=postgresql://gitexposed:gitexposed@localhost:5433/gitexposed" >> apps/web/.env

# Apply schema
pnpm db:migrate
```

Then `pnpm dev` from repo root.

## Database migrations

Migration files live in `apps/web/drizzle/` and are tracked by `drizzle-kit` in the `drizzle.__drizzle_migrations` table on the target DB.

### Workflow

1. Change the schema in `packages/shared/src/db/schema-core.ts` (or `schema.ts` for pro-only tables).
2. Generate a migration file:
   ```bash
   pnpm db:generate --name=<short_description>
   ```
3. Commit both the schema change and the generated `*.sql` + `meta/*.json` files.
4. Apply to the target database (see below).

### Applying to local dev

```bash
pnpm db:migrate
```

Uses `apps/web/.env`'s `DATABASE_URL`.

### Applying to production

`drizzle-kit migrate` needs the **prod** `DATABASE_URL`. The safest pattern is to pull it from your host and run the migrator with Node's native `--env-file` flag so the var never ends up in a committed file:

```bash
# From apps/web:
vercel env pull .env.production.local --environment=production
node --env-file=.env.production.local node_modules/.bin/drizzle-kit migrate
rm .env.production.local
```

`.env*.local` is gitignored. The migrator is idempotent — re-running it is a no-op once the latest migration is recorded in `__drizzle_migrations`.

### If `__drizzle_migrations` is out of sync

If the schema was bootstrapped some other way (e.g. `drizzle-kit push` or hand-run SQL), the tracking table may be empty or incomplete. Back-fill it with one row per already-applied migration before running `migrate`:

```ts
// Compute hash the same way drizzle-orm does:
// crypto.createHash('sha256').update(fs.readFileSync('apps/web/drizzle/<tag>.sql').toString()).digest('hex')
// `created_at` = the `when` value from meta/_journal.json for that entry
```

```sql
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES
  ('<sha256-of-0000.sql>', <when-from-journal>),
  ('<sha256-of-0001.sql>', <when-from-journal>);
```
