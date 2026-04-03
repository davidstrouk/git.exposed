import { exec } from 'node:child_process';
import type { Finding } from '@repo/shared/types';

interface CliScannerOptions {
  command: string;
  timeout?: number;
  maxBuffer?: number;
  parser: (output: string) => Finding[];
}

function execAsync(command: string, options: { timeout: number; maxBuffer: number }): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { encoding: 'utf-8', ...options }, (error, stdout) => {
      if (error) {
        // Many scanners exit non-zero when findings exist — check stdout
        if (stdout) resolve(stdout);
        else reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

export async function runCliScanner({ command, timeout = 60000, maxBuffer = 20 * 1024 * 1024, parser }: CliScannerOptions): Promise<Finding[]> {
  try {
    const output = await execAsync(command, { timeout, maxBuffer });
    return parser(output);
  } catch {
    return [];
  }
}
