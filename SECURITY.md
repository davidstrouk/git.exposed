# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in git.exposed, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please use [GitHub's private vulnerability reporting](https://github.com/davidstrouk/git.exposed/security/advisories/new) to submit your report. This ensures the issue can be addressed before public disclosure.

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response timeline

- **Acknowledgment:** within 48 hours
- **Initial assessment:** within 1 week
- **Fix or mitigation:** as soon as practical, depending on severity

## Security measures

### Authentication & authorization

- GitHub OAuth via Auth.js v5 with `read:user`, `user:email`, and `repo` scopes
- Bearer token authentication between frontend and backend using `crypto.timingSafeEqual`
- GitHub webhook signature verification via HMAC-SHA256
- Pro tier gating for private repo scanning, AI fixes, and continuous monitoring

### Input validation

- Owner/repo names validated with strict regex (`/^[\w.-]+$/`) before any shell or API usage
- GitHub URLs parsed and validated before processing
- JSON request body validation on all API routes
- Rate limiting: 5 scans per minute per IP with 5-minute dedup cache

### Repo download safety

- 100 MB maximum repository size
- 30-second fetch timeout
- Symlink filtering during tar extraction
- Temporary directories cleaned up after scan completion

### Data handling

- No repository source code is persisted — downloaded to temp directory, scanned, deleted
- Database stores only scan metadata and finding summaries
- GitHub OAuth tokens stored encrypted in the database via Auth.js
- Environment secrets never committed to the repository

## Scope

The following are in scope:

- The git.exposed web application (https://git.exposed)
- The scanner API backend
- The shared package (`packages/shared/`)
- Authentication and authorization logic
- Data handling and storage
- Webhook signature verification

The following are out of scope:

- Third-party scanning tools (Betterleaks, OpenGrep, Trivy) — report to their respective projects
- Denial of service attacks
- Social engineering
- Issues in dependencies (report upstream)

## Supported Versions

Only the latest deployed version is supported with security updates.
