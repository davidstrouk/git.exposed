import { execSync } from 'node:child_process';
import type { Finding } from './types';

interface CliScannerOptions {
  command: string;
  timeout?: number;
  maxBuffer?: number;
  parser: (output: string) => Finding[];
}

export function runCliScanner({ command, timeout = 60000, maxBuffer = 20 * 1024 * 1024, parser }: CliScannerOptions): Finding[] {
  try {
    const output = execSync(command, { encoding: 'utf-8', timeout, maxBuffer });
    return parser(output);
  } catch (err: unknown) {
    const stdout = (err as { stdout?: string }).stdout;
    if (stdout) return parser(stdout);
    return [];
  }
}
