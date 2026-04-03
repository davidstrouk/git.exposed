import { describe, it, expect } from 'vitest';
import { dependenciesCheck } from '@/scanner/checks/dependencies';
import path from 'node:path';

const VULN = path.resolve('tests/fixtures/vulnerable-app');

describe('dependenciesCheck', () => {
  it('flags missing lockfile', async () => {
    const f = await dependenciesCheck.run(VULN);
    expect(f.some(x => x.title.toLowerCase().includes('lockfile'))).toBe(true);
  });
  it('handles dir with no package.json', async () => {
    const f = await dependenciesCheck.run(path.resolve('tests/fixtures'));
    expect(f).toHaveLength(0);
  });
});
