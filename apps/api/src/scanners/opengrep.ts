import type { Finding } from '@repo/shared/types';
import { runCliScanner } from './run-cli';

interface OpengrepResult {
  check_id: string;
  path: string;
  start: { line: number; col?: number };
  extra: { message: string; severity: string; metadata: Record<string, string> };
}

function mapSeverity(sev: string): Finding['severity'] {
  switch (sev.toUpperCase()) {
    case 'ERROR': return 'critical';
    case 'WARNING': return 'medium';
    case 'INFO': return 'info';
    default: return 'medium';
  }
}

export function parseOpengrepOutput(output: string): Finding[] {
  try {
    const parsed = JSON.parse(output);
    const results: OpengrepResult[] = parsed.results || [];
    return results.map((r) => ({
      checkName: 'opengrep',
      severity: mapSeverity(r.extra.severity),
      title: r.check_id.split('.').pop()?.replace(/-/g, ' ') || r.check_id,
      description: r.extra.message,
      file: r.path,
      line: r.start.line,
    }));
  } catch {
    return [];
  }
}

export function runOpengrep(directory: string): Promise<Finding[]> {
  return runCliScanner({
    command: `opengrep scan --config auto --json "${directory}"`,
    parser: parseOpengrepOutput,
  });
}
