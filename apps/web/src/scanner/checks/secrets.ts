import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Check, Finding, Severity } from '@repo/shared/types';
import { walk } from './walk';

interface Pattern {
  name: string;
  regex: RegExp;
  severity: Severity;
  description: string;
}

const PATTERNS: Pattern[] = [
  {
    name: 'AWS Access Key',
    regex: /(?:^|[^A-Za-z0-9/+=])AKIA[0-9A-Z]{16}(?:[^A-Za-z0-9/+=]|$)/,
    severity: 'critical',
    description: 'AWS access key found. This grants access to your AWS account.',
  },
  {
    name: 'Stripe Secret Key',
    regex: /sk_live_[0-9a-zA-Z]{24,}/,
    severity: 'critical',
    description: 'Stripe live secret key found. Can be used to make charges on your account.',
  },
  {
    name: 'GitHub Token',
    regex: /ghp_[A-Za-z0-9]{36,}/,
    severity: 'critical',
    description: 'GitHub personal access token found. Grants access to your repositories.',
  },
  {
    name: 'Slack Webhook',
    regex: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/,
    severity: 'high',
    description: 'Slack webhook URL exposed. Anyone can post to your channel.',
  },
  {
    name: 'JWT Token',
    regex: /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/,
    severity: 'high',
    description: 'Hardcoded JWT token found. Tokens should be in environment variables.',
  },
  {
    name: 'Generic API Key',
    regex: /(?:api_key|apikey|api_secret|secret_key|private_key)\s*[:=]\s*["'][A-Za-z0-9+/=]{20,}["']/i,
    severity: 'high',
    description: 'Possible API key or secret hardcoded in source code.',
  },
];

// Test suites, docs and fixtures are full of credential-shaped strings that are
// not credentials. These tells are cheap and high-confidence. Anything subtler
// stays a finding, because a missed real key costs more than a false positive.
const PLACEHOLDER_WORD = /example|placeholder|dummy|fake|sample|redacted|changeme|your[_-]?|notreal|deadbeef|xxxx/i;
const REPEATED_RUN = /(.)\1{5,}/;

/** True when the value runs 6 or more consecutive characters, such as `abcdef`. */
function hasSequentialRun(value: string): boolean {
  let run = 1;
  for (let i = 1; i < value.length; i++) {
    run = value.charCodeAt(i) - value.charCodeAt(i - 1) === 1 ? run + 1 : 1;
    if (run >= 6) return true;
  }
  return false;
}

export const isPlaceholderSecret = (value: string) =>
  PLACEHOLDER_WORD.test(value) || REPEATED_RUN.test(value) || hasSequentialRun(value);

export const secretsCheck: Check = {
  name: 'secrets',
  async run(directory) {
    const findings: Finding[] = [];
    // A committed credential is exploitable wherever it lives, so test paths are
    // read too. Placeholder values are filtered below instead.
    for (const file of await walk(directory, { skipTestPaths: false })) {
      const lines = (await readFile(file, 'utf-8')).split('\n');
      for (let i = 0; i < lines.length; i++) {
        for (const p of PATTERNS) {
          const match = lines[i].match(p.regex);
          if (match && !isPlaceholderSecret(match[0])) {
            findings.push({
              checkName: 'secrets',
              severity: p.severity,
              title: `${p.name} detected`,
              description: p.description,
              file: path.relative(directory, file),
              line: i + 1,
            });
          }
        }
      }
    }
    return findings;
  },
};
