import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Check, Finding, Severity } from '@repo/shared/types';
import { isStrippable, stripComments, stripCommentsAndStrings } from './strip-code';
import { walk } from './walk';

interface Pattern {
  title: string;
  regex: RegExp;
  severity: Severity;
  description: string;
  /**
   * True for patterns that match the *contents* of a string literal, such as
   * SQL text built by concatenation. Those must see strings intact; every other
   * pattern matches a code construct and is scanned with strings blanked, so a
   * file that merely documents the construct is not reported.
   */
  matchesStringContent?: boolean;
}

const PATTERNS: Pattern[] = [
  {
    title: 'Dangerous eval() usage',
    regex: /\beval\s*\(/,
    severity: 'critical',
    description: 'eval() executes arbitrary code. An attacker can inject malicious JavaScript.',
  },
  {
    title: 'Unsafe innerHTML assignment',
    regex: /\.innerHTML\s*=/,
    severity: 'high',
    description: 'innerHTML with user input enables XSS attacks. Use textContent instead.',
  },
  {
    title: 'Dangerous document.write()',
    regex: /document\.write\s*\(/,
    severity: 'high',
    description: 'document.write() can inject arbitrary HTML. Use DOM APIs instead.',
  },
  {
    title: 'Possible SQL injection',
    regex: /(?:SELECT|INSERT|UPDATE|DELETE|DROP)\s+.*(?:\+\s*\w|\$\{)/i,
    severity: 'critical',
    description: 'SQL built with string concatenation allows injection. Use parameterized queries.',
    matchesStringContent: true,
  },
  {
    title: 'Command injection risk',
    regex: /(?:child_process|exec|execSync|spawn)\s*\(\s*(?:req\.|request\.|params\.|body\.|query\.)/,
    severity: 'critical',
    description: 'User input in shell commands enables command injection.',
  },
];

export const securityCheck: Check = {
  name: 'security-patterns',
  async run(directory) {
    const findings: Finding[] = [];
    for (const file of await walk(directory)) {
      const source = await readFile(file, 'utf-8');
      const strippable = isStrippable(file);
      // Same line count and columns as the source, so line numbers still line up.
      const codeLines = (strippable ? stripCommentsAndStrings(source) : source).split('\n');
      const textLines = (strippable ? stripComments(source) : source).split('\n');
      for (let i = 0; i < codeLines.length; i++) {
        for (const p of PATTERNS) {
          if (p.regex.test(p.matchesStringContent ? textLines[i] : codeLines[i])) {
            findings.push({
              checkName: 'security-patterns',
              severity: p.severity,
              title: p.title,
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
