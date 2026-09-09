import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { walk } from '@/scanner/checks/walk';

let root: string;

const rel = (files: string[], from: string) =>
  files.map((f) => path.relative(from, f).split(path.sep).join('/')).sort();

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'walk-'));
  const write = async (p: string, body = '// x\n') => {
    await mkdir(path.dirname(path.join(root, p)), { recursive: true });
    await writeFile(path.join(root, p), body);
  };
  await write('src/app.ts');
  await write('src/helpers.test.ts');
  await write('src/thing.spec.js');
  await write('tests/fixtures/vulnerable/app.js');
  await write('__tests__/thing.ts');
  await write('spec/foo.ts');
  await write('mocks/bar.ts');
  await write('__mocks__/fs.ts');
  await write('__fixtures__/data.ts');
  await write('e2e/flow.ts');
  await write('testdata/seed.json');
  await write('node_modules/pkg/index.js');
});

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('walk', () => {
  it('excludes test, fixture and mock paths under the scan root', async () => {
    expect(rel(await walk(root), root)).toEqual(['src/app.ts']);
  });

  it('keeps files when the scan root is itself a fixture directory', async () => {
    const fixture = path.join(root, 'tests/fixtures/vulnerable');
    expect(rel(await walk(fixture), fixture)).toEqual(['app.js']);
  });

  it('still skips node_modules', async () => {
    const files = await walk(root);
    expect(files.some((f) => f.includes('node_modules'))).toBe(false);
  });
});
