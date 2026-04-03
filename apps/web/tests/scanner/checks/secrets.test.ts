import { describe, it, expect } from 'vitest';
import { secretsCheck } from '@/scanner/checks/secrets';
import path from 'node:path';

const VULN = path.resolve('tests/fixtures/vulnerable-app');
const SAFE = path.resolve('tests/fixtures/safe-app');

describe('secretsCheck', () => {
  it('detects AWS keys', async () => {
    const f = await secretsCheck.run(VULN);
    expect(f.some(x => x.title.includes('AWS'))).toBe(true);
  });
  it('detects Slack webhooks', async () => {
    const f = await secretsCheck.run(VULN);
    expect(f.some(x => x.title.includes('Slack'))).toBe(true);
  });
  it('detects GitHub tokens', async () => {
    const f = await secretsCheck.run(VULN);
    expect(f.some(x => x.title.includes('GitHub'))).toBe(true);
  });
  it('returns nothing for safe app', async () => {
    expect(await secretsCheck.run(SAFE)).toHaveLength(0);
  });
});
