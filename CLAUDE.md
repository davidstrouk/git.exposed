@AGENTS.md

# git.exposed — Project Guidelines

## Architecture
- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: Next.js 16 App Router at `apps/web/`, deployed to Vercel
- **Backend**: Hono API at `apps/api/`, deployed to Railway via Dockerfile
- **Shared**: `packages/shared/` — DB schema, types, scoring, GitHub utils, validation
- **Database**: Neon PostgreSQL via Drizzle ORM

## Key Rules
- Shared package is "internal" — no build step, exports point to `.ts` source files
- `apps/web/next.config.ts` must have `transpilePackages: ["@repo/shared"]`
- `apps/web/vercel.json` must have `"framework": "nextjs"` — Vercel misdetects as Hono otherwise
- DB connection uses lazy proxy pattern (`packages/shared/src/db/index.ts`) to avoid build-time crashes
- `globals.css` uses dark background by default (not media query) — app is always dark-themed
- GitHub repo is PUBLIC — never commit secrets, strategy docs, or monetization plans
- `docs/plans/` is gitignored — keep local planning docs out of the repo

## Development
- Dev all: `pnpm turbo dev` from repo root
- Dev frontend only: `pnpm dev --filter=@repo/web`
- Dev backend only: `pnpm dev --filter=@repo/api`
- Build all: `pnpm turbo build`
- Test all: `pnpm turbo test`

## Backend Deployment
- Dockerfile builds from repo root (needs `packages/shared/`)
- Railway root directory: repo root, Dockerfile path: `apps/api/Dockerfile`
- Railway watch paths: `apps/api/**`, `packages/shared/**`
- Uses `npx tsx src/index.ts` (not compiled JS) to avoid ESM import issues
- Scanners run async (`exec` not `execSync`) in parallel via `Promise.all`
- `SCAN_SECRET` env var required — backend fails at startup if missing

## Testing
- Run all: `pnpm turbo test` from project root
- Test fixtures in `apps/web/tests/fixtures/vulnerable-app/` — fake secrets must avoid GitHub push protection patterns

## Security
- Auth: `crypto.timingSafeEqual` for bearer token comparison
- Downloads: 100MB size limit, 30s timeout, symlink filtering
- Input: owner/repo validated via `isValidRepoName()` from `@repo/shared/validation`
- Rate limiting: 5 scans/min/IP with 5-min dedup cache
