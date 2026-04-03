@AGENTS.md

# git.exposed — Project Guidelines

## Architecture
- Frontend: Next.js 16 App Router on Vercel (`davidstrouks-projects/git-exposed`)
- Backend: Hono API on Railway (`backend/` dir, deployed separately via Dockerfile)
- Database: Neon PostgreSQL via Drizzle ORM
- Tests: Vitest (41 tests across 10 files)

## Key Rules
- `tsconfig.json` excludes `backend/` — never include backend in Next.js build
- `vercel.json` must have `"framework": "nextjs"` — Vercel misdetects as Hono otherwise
- DB connection uses lazy proxy pattern (`src/db/index.ts`) to avoid build-time crashes
- `globals.css` uses dark background by default (not media query) — app is always dark-themed
- GitHub repo is PUBLIC — never commit secrets, strategy docs, or monetization plans
- `docs/plans/` is gitignored — keep local planning docs out of the repo

## Backend Deployment
- Deploy from `backend/` directory: `cd backend && railway up --detach`
- Uses `npx tsx src/index.ts` (not compiled JS) to avoid ESM import issues
- Scanners run async (`exec` not `execSync`) in parallel via `Promise.all`
- `SCAN_SECRET` env var required — backend fails at startup if missing

## Testing
- Run all: `npx vitest run` from project root
- Test fixtures in `tests/fixtures/vulnerable-app/` — fake secrets must avoid GitHub push protection patterns (`sk_live_*`, `hooks.slack.com/services/*`)

## Security
- Auth: `crypto.timingSafeEqual` for bearer token comparison
- Downloads: 100MB size limit, 30s timeout, symlink filtering
- Input: owner/repo validated with `/^[\w.-]+$/` regex
- Rate limiting: 5 scans/min/IP with 5-min dedup cache
