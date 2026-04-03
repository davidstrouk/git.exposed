import type { Check, Finding, Severity } from '../types';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { walk } from './walk';

interface Pattern { name: string; regex: RegExp; severity: Severity; description: string; }

const PATTERNS: Pattern[] = [
  { name: 'AWS Access Key', regex: /(?:^|[^A-Za-z0-9/+=])AKIA[0-9A-Z]{16}(?:[^A-Za-z0-9/+=]|$)/, severity: 'critical', description: 'AWS access key found. This grants access to your AWS account.' },
  { name: 'Stripe Secret Key', regex: /sk_live_[0-9a-zA-Z]{24,}/, severity: 'critical', description: 'Stripe live secret key found. Can be used to make charges on your account.' },
  { name: 'GitHub Token', regex: /ghp_[A-Za-z0-9]{36,}/, severity: 'critical', description: 'GitHub personal access token found. Grants access to your repositories.' },
  { name: 'Slack Webhook', regex: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/, severity: 'high', description: 'Slack webhook URL exposed. Anyone can post to your channel.' },
  { name: 'JWT Token', regex: /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/, severity: 'high', description: 'Hardcoded JWT token found. Tokens should be in environment variables.' },
  { name: 'Generic API Key', regex: /(?:api_key|apikey|api_secret|secret_key|private_key)\s*[:=]\s*["'][A-Za-z0-9+/=]{20,}["']/i, severity: 'high', description: 'Possible API key or secret hardcoded in source code.' },
];

export const secretsCheck: Check = {
  name: 'secrets',
  async run(directory) {
    const findings: Finding[] = [];
    for (const file of await walk(directory)) {
      const lines = (await readFile(file, 'utf-8')).split('\n');
      for (let i = 0; i < lines.length; i++) {
        for (const p of PATTERNS) {
          if (p.regex.test(lines[i])) {
            findings.push({
              checkName: 'secrets', severity: p.severity,
              title: `${p.name} detected`, description: p.description,
              file: path.relative(directory, file), line: i + 1,
            });
          }
        }
      }
    }
    return findings;
  },
};
