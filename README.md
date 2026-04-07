<div align="center">
  <img src="apps/web/public/logo.svg" alt="git.exposed logo" width="80" />
  <h1>git.exposed</h1>
  <p><strong>Find exposed secrets and vulnerabilities in any GitHub repo.</strong></p>
  <p>
    <a href="https://git.exposed">Website</a> &middot;
    <a href="#getting-started">Getting Started</a> &middot;
    <a href="#architecture">Architecture</a>
  </p>

  ![CI](https://github.com/davidstrouk/git.exposed/actions/workflows/ci.yml/badge.svg)
  ![License](https://img.shields.io/github/license/davidstrouk/git.exposed)
</div>

---

Paste a GitHub URL, get a security report in seconds. Share a badge in your README.

```markdown
![git.exposed](https://git.exposed/badge/YOUR_USERNAME/YOUR_REPO)
```

## What it scans

| Engine | What it finds | Rules |
|--------|---------------|-------|
| [Betterleaks](https://github.com/betterleaks/betterleaks) | Exposed API keys, tokens, webhooks | 150+ patterns |
| [OpenGrep](https://github.com/opengrep/opengrep) | XSS, SQL injection, command injection, insecure patterns | 3,000+ SAST rules |
| [Trivy](https://github.com/aquasecurity/trivy) | Known CVEs in dependencies | Real vulnerability database |
| Built-in checks | Hardcoded secrets, missing lockfiles, dangerous functions | 14 regex patterns |

Each repo gets a **Vibe Safety Score** (0-100) and a letter grade (A-F).

## Features

- **Instant scanning** — paste a URL, get results in seconds
- **Auto-scan on visit** — `git.exposed/owner/repo` triggers a scan automatically
- **Fix It For Me** — AI generates a PR to fix findings (Pro)
- **Continuous monitoring** — GitHub webhooks rescan on every push (Pro)
- **Commit status checks** — pass/fail status on every push (Pro)
- **GitHub OAuth** — sign in to scan private repos
- **SVG badge** — embed your score in any README
- **Share links** — `git.exposed/owner/repo` is the report URL

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10+
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)

### Setup

```bash
git clone https://github.com/davidstrouk/git.exposed.git
cd git.exposed
pnpm install
cp .env.example .env
```

Edit `.env` with your database URL:

```bash
# Required
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

# Optional — scanner backend (without this, built-in regex checks run)
SCANNER_BACKEND_URL=http://localhost:4000
SCAN_SECRET=any-shared-secret
```

> [!TIP]
> See `.env.example` for all available environment variables including GitHub OAuth, billing, and webhook configuration.

### Apply database schema

```bash
cd apps/web && npx drizzle-kit push
```

### Run the dev server

```bash
pnpm turbo dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run tests

```bash
pnpm turbo test              # 87 unit tests
cd apps/web && pnpm test:e2e # 24 e2e tests (Playwright)
```

### Run the scanner backend (optional)

The backend runs Betterleaks, OpenGrep, and Trivy for deep scanning. Without it, the frontend uses built-in regex checks.

```bash
cd apps/api
SCAN_SECRET=any-shared-secret PORT=4000 npx tsx src/index.ts
```

> [!NOTE]
> The backend requires `betterleaks`, `opengrep`, and `trivy` binaries installed. See the [Dockerfile](apps/api/Dockerfile) for installation steps.

## Architecture

```
git.exposed/
├── apps/
│   ├── web/           Next.js 16 — frontend, API routes, auth
│   └── api/           Hono — scanner backend, fix worker
├── packages/
│   └── shared/        DB schema, types, scoring, GitHub utils
```

```
┌─────────────────────┐       ┌──────────────────────┐
│  Next.js 16 (Vercel)│──────▶│  Hono API (Railway)  │
│  - Scan API         │       │  - Betterleaks       │
│  - Report pages     │       │  - OpenGrep          │
│  - Auth (OAuth)     │       │  - Trivy             │
│  - Billing (LS)     │       │  - Fix worker        │
│  - Webhook handler  │       │  - pg-boss queue     │
└────────┬────────────┘       └──────────────────────┘
         │
    ┌────▼────┐
    │  Neon   │
    │Postgres │
    └─────────┘
```

### Scoring

| Grade | Score | Meaning |
|-------|-------|---------|
| **A** | 90-100 | Clean — ship it |
| **B** | 80-89 | Minor issues |
| **C** | 70-79 | Needs attention |
| **D** | 50-69 | Significant problems |
| **F** | 0-49 | Do not deploy |

Deductions: critical (-25), high (-15), medium (-8), low (-3), info (0).

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | [Next.js](https://nextjs.org) 16, [React](https://react.dev) 19, [Tailwind CSS](https://tailwindcss.com) 4 |
| Backend | [Hono](https://hono.dev) 4, [tsx](https://tsx.is) |
| Database | [Neon](https://neon.tech) PostgreSQL, [Drizzle](https://orm.drizzle.team) ORM |
| Auth | [Auth.js](https://authjs.dev) v5 (GitHub OAuth) |
| Billing | [Lemon Squeezy](https://lemonsqueezy.com) |
| AI Fixes | [GitHub Copilot SDK](https://github.com/github/copilot-sdk) (BYOK), [Octokit](https://github.com/octokit/rest.js) |
| Queue | [pg-boss](https://github.com/timgit/pg-boss) |
| Testing | [Vitest](https://vitest.dev), [Playwright](https://playwright.dev), [axe-core](https://github.com/dequelabs/axe-core) |
| CI/CD | [GitHub Actions](https://github.com/features/actions), [Turborepo](https://turbo.build) |
| Deploy | [Vercel](https://vercel.com) (frontend), [Railway](https://railway.com) (backend) |

## Development

| Command | Description |
|---------|-------------|
| `pnpm turbo dev` | Start all services |
| `pnpm turbo build` | Build all packages |
| `pnpm turbo test` | Run unit tests |
| `pnpm turbo lint` | Lint all packages |
| `pnpm dev --filter=@repo/web` | Frontend only |
| `pnpm dev --filter=@repo/api` | Backend only |

## License

[MIT](LICENSE)
