import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { secretsCheck } from '@/scanner/checks/secrets';

const VULN = path.resolve('tests/fixtures/vulnerable-app');
const SAFE = path.resolve('tests/fixtures/safe-app');
const REPO_ROOT = path.resolve('../..');

// Credential-shaped values with no placeholder tell, so the check must report
// them. Split so no contiguous secret exists in this file: a literal would trip
// GitHub push protection and the repo-root scan below.
const LIVE_AWS = ['AKIA', '3M7QZ2K9WD4XP1RT'].join('');
const LIVE_GITHUB = ['ghp_', 'k4Rm9WqZ2xT7vN1bJ8sYcH3dLpQ6uF0aEg5i'].join('');
const LIVE_SLACK = ['https://hooks.slack.com/services/', 'T7K2QZ9/B4XM1RD/9wQz2XmK7tRv3NpL8sYcH4dJ'].join('');

let live: string;

beforeAll(async () => {
  live = await mkdtemp(path.join(tmpdir(), 'secrets-live-'));
  await writeFile(
    path.join(live, 'config.js'),
    [`const a = '${LIVE_AWS}';`, `const g = '${LIVE_GITHUB}';`, `const s = '${LIVE_SLACK}';`].join('\n'),
  );
});

afterAll(async () => {
  await rm(live, { recursive: true, force: true });
});

describe('secretsCheck', () => {
  it('detects AWS keys', async () => {
    const f = await secretsCheck.run(live);
    expect(f.some((x) => x.title.includes('AWS'))).toBe(true);
  });
  it('detects Slack webhooks', async () => {
    const f = await secretsCheck.run(live);
    expect(f.some((x) => x.title.includes('Slack'))).toBe(true);
  });
  it('detects GitHub tokens', async () => {
    const f = await secretsCheck.run(live);
    expect(f.some((x) => x.title.includes('GitHub'))).toBe(true);
  });
  it('returns nothing for safe app', async () => {
    expect(await secretsCheck.run(SAFE)).toHaveLength(0);
  });

  // The committed fixture must stay push-protection-safe, so its secrets are
  // placeholder-shaped and the check is right to ignore them.
  it('ignores the placeholder secrets in the vulnerable-app fixture', async () => {
    expect(await secretsCheck.run(VULN)).toEqual([]);
  });

  it('reports no findings against this repository', async () => {
    const f = await secretsCheck.run(REPO_ROOT);
    expect(f.map((x) => `${x.severity} ${x.title} ${x.file}:${x.line}`)).toEqual([]);
  });
});

describe('secretsCheck sees test paths, unlike securityCheck', () => {
  let dir: string;

  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'secrets-tests-'));
    await mkdir(path.join(dir, 'tests/fixtures'), { recursive: true });
    // A real credential is exploitable wherever someone commits it.
    await writeFile(path.join(dir, 'tests/fixtures/leak.js'), `const key = '${LIVE_AWS}';\n`);
    // Placeholders in the same place are not findings.
    await writeFile(
      path.join(dir, 'tests/fixtures/fake.js'),
      [
        "const aws = 'AKIAIOSFODNN7EXAMPLE';",
        "const gh = 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef1234';",
        "const hook = 'https://hooks.slack.com/services/T0AAAAAA/B0AAAAAA/aaaaaaaaaaaaaaaaaaaaaaaa';",
      ].join('\n'),
    );
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('reports a real credential committed under a test path', async () => {
    const f = await secretsCheck.run(dir);
    expect(f.map((x) => `${x.title} ${x.file}`)).toEqual(['AWS Access Key detected tests/fixtures/leak.js']);
  });

  it('ignores placeholder credentials', async () => {
    const f = await secretsCheck.run(dir);
    expect(f.filter((x) => x.file.endsWith('fake.js'))).toEqual([]);
  });
});
