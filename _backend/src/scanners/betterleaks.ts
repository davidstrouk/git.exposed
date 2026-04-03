import { execSync } from 'node:child_process';

export interface Finding {
  checkName: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  file: string;
  line?: number;
}

interface BetterleaksResult {
  Description: string;
  File: string;
  StartLine: number;
  Secret: string;
  Match: string;
  RuleID: string;
}

export function parseBetterleaksOutput(output: string): Finding[] {
  try {
    const parsed = JSON.parse(output);
    const results: BetterleaksResult[] = parsed.results || parsed || [];
    if (!Array.isArray(results)) return [];
    return results.map((r) => ({
      checkName: 'betterleaks',
      severity: 'critical' as const,
      title: `${r.Description} detected`,
      description: `Secret matching rule "${r.RuleID}" found. This credential should be rotated immediately and moved to environment variables.`,
      file: r.File,
      line: r.StartLine,
    }));
  } catch {
    return [];
  }
}

export function runBetterleaks(directory: string): Finding[] {
  try {
    const output = execSync(
      `betterleaks detect --source="${directory}" --report-format=json --no-git`,
      { encoding: 'utf-8', timeout: 30000, maxBuffer: 10 * 1024 * 1024 },
    );
    return parseBetterleaksOutput(output);
  } catch (err: any) {
    if (err.stdout) return parseBetterleaksOutput(err.stdout);
    return [];
  }
}
