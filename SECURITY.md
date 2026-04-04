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

## Scope

The following are in scope:

- The git.exposed web application (https://git.exposed)
- The scanner API backend
- The shared package (`packages/shared/`)
- Authentication and authorization logic
- Data handling and storage

The following are out of scope:

- Third-party tools (Betterleaks, OpenGrep, Trivy) -- report to their respective projects
- Denial of service attacks
- Social engineering

## Supported Versions

Only the latest deployed version is supported with security updates.
