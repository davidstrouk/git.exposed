import { describe, it, expect } from 'vitest';
import { securityCheck } from '@/scanner/checks/security';
import path from 'node:path';

const VULN = path.resolve('tests/fixtures/vulnerable-app');
const SAFE = path.resolve('tests/fixtures/safe-app');

describe('securityCheck', () => {
  it('detects eval()', async () => {
    const f = await securityCheck.run(VULN);
    expect(f.some(x => x.title.toLowerCase().includes('eval'))).toBe(true);
  });
  it('detects innerHTML', async () => {
    const f = await securityCheck.run(VULN);
    expect(f.some(x => x.title.toLowerCase().includes('innerhtml'))).toBe(true);
  });
  it('detects SQL injection', async () => {
    const f = await securityCheck.run(VULN);
    expect(f.some(x => x.title.toLowerCase().includes('sql'))).toBe(true);
  });
  it('returns nothing for safe app', async () => {
    expect(await securityCheck.run(SAFE)).toHaveLength(0);
  });
});
