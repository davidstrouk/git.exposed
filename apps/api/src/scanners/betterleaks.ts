import type { Finding } from './types';
import { runCliScanner } from './run-cli';

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

export function runBetterleaks(directory: string): Promise<Finding[]> {
  return runCliScanner({
    command: `betterleaks detect --source="${directory}" --report-format=json --no-git`,
    timeout: 30000,
    parser: parseBetterleaksOutput,
  });
}
