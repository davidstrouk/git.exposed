import type { Check, Finding, Severity } from '../types';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

interface Pattern { title: string; regex: RegExp; severity: Severity; description: string; }

const PATTERNS: Pattern[] = [
  { title: 'Dangerous eval() usage', regex: /\beval\s*\(/, severity: 'critical', description: 'eval() executes arbitrary code. An attacker can inject malicious JavaScript.' },
  { title: 'Unsafe innerHTML assignment', regex: /\.innerHTML\s*=/, severity: 'high', description: 'innerHTML with user input enables XSS attacks. Use textContent instead.' },
  { title: 'Dangerous document.write()', regex: /document\.write\s*\(/, severity: 'high', description: 'document.write() can inject arbitrary HTML. Use DOM APIs instead.' },
  { title: 'Possible SQL injection', regex: /(?:SELECT|INSERT|UPDATE|DELETE|DROP)\s+.*(?:\+\s*\w|\$\{)/i, severity: 'critical', description: 'SQL built with string concatenation allows injection. Use parameterized queries.' },
  { title: 'Command injection risk', regex: /(?:child_process|exec|execSync|spawn)\s*\(\s*(?:req\.|request\.|params\.|body\.|query\.)/, severity: 'critical', description: 'User input in shell commands enables command injection.' },
];

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build', 'coverage']);
const CODE_EXTS = new Set(['.js', '.ts', '.jsx', '.tsx', '.py', '.rb', '.go', '.java', '.php']);

async function walk(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...await walk(full));
    else if (CODE_EXTS.has(path.extname(e.name))) files.push(full);
  }
  return files;
}

export const securityCheck: Check = {
  name: 'security-patterns',
  async run(directory) {
    const findings: Finding[] = [];
    for (const file of await walk(directory)) {
      const lines = (await readFile(file, 'utf-8')).split('\n');
      for (let i = 0; i < lines.length; i++) {
        for (const p of PATTERNS) {
          if (p.regex.test(lines[i])) {
            findings.push({
              checkName: 'security-patterns', severity: p.severity,
              title: p.title, description: p.description,
              file: path.relative(directory, file), line: i + 1,
            });
          }
        }
      }
    }
    return findings;
  },
};
