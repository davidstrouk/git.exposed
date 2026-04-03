# git.exposed

**Is your code exposed?**

Paste any public GitHub URL. Get a security report in seconds. Share the results.

## What It Checks

| Check | Finds |
|-------|-------|
| **Secrets** | Exposed API keys (AWS, Stripe, GitHub), tokens, webhooks |
| **Security Patterns** | XSS (eval, innerHTML), SQL injection, command injection |
| **Dependencies** | Missing lockfiles, unpinned versions |
| **Deep Scanning** | 150+ secret patterns (Betterleaks), 3000+ SAST rules (OpenGrep), real CVEs (Trivy) |

## Try It

Visit **[git.exposed](https://git.exposed)** and paste a GitHub URL.

Or add a badge to your README:

```markdown
![git.exposed](https://git.exposed/badge/YOUR_USERNAME/YOUR_REPO)
```

## Local Development

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)

### Setup

```bash
git clone https://github.com/davidstrouk/git.exposed.git
cd git.exposed
npm install
cp .env.example .env
```

Edit `.env` and add your `DATABASE_URL` (required). The other variables are optional for local development:

```bash
# Required
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

# Optional — scanner backend (without this, built-in regex checks are used)
SCANNER_BACKEND_URL=http://localhost:4000
SCAN_SECRET=any-shared-secret

# Optional — GitHub OAuth (needed for private repo scanning)
AUTH_SECRET=          # generate with: npx auth secret
AUTH_GITHUB_ID=       # from GitHub OAuth App
AUTH_GITHUB_SECRET=   # from GitHub OAuth App

# Optional — Lemon Squeezy billing
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_VARIANT_ID=
```

### Apply database schema

```bash
npx drizzle-kit push
```

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run tests

```bash
npx vitest run        # all 60 tests
npx vitest --watch    # watch mode
```

### Run the scanner backend (optional)

The backend runs Betterleaks, OpenGrep, and Trivy for deep scanning. Without it, the frontend falls back to built-in regex checks.

```bash
cd backend
npm install
# Requires Docker for OpenGrep and Trivy
SCAN_SECRET=any-shared-secret PORT=4000 npx tsx src/index.ts
```

## Architecture

```
┌─────────────────┐       ┌──────────────────────┐
│  Next.js (Vercel)│──────▶│  Hono API (Railway)  │
│  - Scan API      │       │  - Betterleaks       │
│  - Report pages  │       │  - OpenGrep           │
│  - Auth (OAuth)  │       │  - Trivy              │
│  - Billing (LS)  │       └──────────────────────┘
└────────┬─────────┘
         │
    ┌────▼────┐
    │  Neon   │
    │ Postgres│
    └─────────┘
```

## Scoring

| Grade | Score | Meaning |
|-------|-------|---------|
| A | 90-100 | Ship it! |
| B | 80-89 | Minor issues |
| C | 70-79 | Needs attention |
| D | 50-69 | Significant problems |
| F | 0-49 | Do not deploy |

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Neon PostgreSQL + Drizzle ORM
- **Auth:** Auth.js v5 (GitHub OAuth)
- **Billing:** Lemon Squeezy
- **Scanning:** Built-in TypeScript checks + Betterleaks + OpenGrep + Trivy
- **Deployment:** Vercel (frontend) + Railway (scanner backend)

## License

MIT
