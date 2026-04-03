# git.exposed

**Is your code exposed?**

Paste any public GitHub URL. Get a security report in seconds. Share the results.

## What It Checks

| Check | Finds |
|-------|-------|
| **Secrets** | Exposed API keys (AWS, Stripe, GitHub), tokens, webhooks |
| **Security Patterns** | XSS (eval, innerHTML), SQL injection, command injection |
| **Dependencies** | Missing lockfiles, unpinned versions |

## Try It

Visit **[git.exposed](https://git.exposed)** and paste a GitHub URL.

Or add a badge to your README:

```markdown
![git.exposed](https://git.exposed/badge/YOUR_USERNAME/YOUR_REPO)
```

## Self-Host

```bash
git clone https://github.com/gitexposed/git-exposed
cd git-exposed
cp .env.example .env  # Add your Neon DATABASE_URL
npm install
npm run dev
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

- **Framework:** Next.js 15 (App Router)
- **Database:** Neon PostgreSQL + Drizzle ORM
- **Scanning:** Built-in TypeScript checks (Phase 1), Betterleaks + OpenGrep + Trivy (Phase 2)
- **Deployment:** Vercel

## License

MIT
