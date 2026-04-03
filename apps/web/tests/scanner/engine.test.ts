import { describe, it, expect } from 'vitest';
import { scan } from '@/scanner/engine';
import type { Check, Finding } from '@repo/shared/types';

describe('scan', () => {
  it('runs all checks and returns aggregated findings', async () => {
    const mockFinding: Finding = {
      checkName: 'test-check',
      severity: 'high',
      title: 'Test finding',
      description: 'A test finding',
      file: 'app.js',
      line: 10,
    };
    const mockCheck: Check = {
      name: 'test-check',
      run: async () => [mockFinding],
    };
    const result = await scan('/fake/dir', [mockCheck]);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toEqual(mockFinding);
    expect(result.checksRun).toEqual(['test-check']);
  });

  it('aggregates findings from multiple checks', async () => {
    const checkA: Check = { name: 'check-a', run: async () => [{ checkName: 'check-a', severity: 'low', title: 'Low', description: 'd', file: 'a.js' }] };
    const checkB: Check = { name: 'check-b', run: async () => [{ checkName: 'check-b', severity: 'critical', title: 'Crit', description: 'd', file: 'b.js' }] };
    const result = await scan('/fake', [checkA, checkB]);
    expect(result.findings).toHaveLength(2);
    expect(result.checksRun).toEqual(['check-a', 'check-b']);
  });

  it('handles checks that throw without crashing', async () => {
    const failingCheck: Check = { name: 'broken', run: async () => { throw new Error('broke'); } };
    const goodCheck: Check = { name: 'good', run: async () => [] };
    const result = await scan('/fake', [failingCheck, goodCheck]);
    expect(result.checksRun).toContain('good');
  });
});
