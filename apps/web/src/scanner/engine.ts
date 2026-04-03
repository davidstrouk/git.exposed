import type { Check, ScanResult } from '@repo/shared/types';

export async function scan(directory: string, checks: Check[]): Promise<ScanResult> {
  const findings: ScanResult['findings'] = [];
  const checksRun: string[] = [];
  for (const check of checks) {
    try {
      const results = await check.run(directory);
      findings.push(...results);
      checksRun.push(check.name);
    } catch {
      // Check failed — skip it, don't crash the scan
    }
  }
  return { findings, checksRun };
}
