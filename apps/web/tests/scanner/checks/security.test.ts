import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { securityCheck } from '@/scanner/checks/security';

const VULN = path.resolve('tests/fixtures/vulnerable-app');
const SAFE = path.resolve('tests/fixtures/safe-app');
const REPO_ROOT = path.resolve('../..');

describe('securityCheck', () => {
  it('detects eval()', async () => {
    const f = await securityCheck.run(VULN);
    expect(f.some((x) => x.title.toLowerCase().includes('eval'))).toBe(true);
  });
  it('detects innerHTML', async () => {
    const f = await securityCheck.run(VULN);
    expect(f.some((x) => x.title.toLowerCase().includes('innerhtml'))).toBe(true);
  });
  it('detects SQL injection', async () => {
    const f = await securityCheck.run(VULN);
    expect(f.some((x) => x.title.toLowerCase().includes('sql'))).toBe(true);
  });
  it('detects document.write()', async () => {
    const f = await securityCheck.run(VULN);
    expect(f.some((x) => x.title.toLowerCase().includes('document.write'))).toBe(true);
  });
  it('detects command injection', async () => {
    const f = await securityCheck.run(VULN);
    expect(f.some((x) => x.title.toLowerCase().includes('command injection'))).toBe(true);
  });
  it('returns nothing for safe app', async () => {
    expect(await securityCheck.run(SAFE)).toHaveLength(0);
  });

  it('reports no findings against this repository', async () => {
    const f = await securityCheck.run(REPO_ROOT);
    expect(f.map((x) => `${x.severity} ${x.title} ${x.file}:${x.line}`)).toEqual([]);
  });
});

describe('securityCheck ignores code quoted in comments and strings', () => {
  let dir: string;

  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'security-doc-'));
    await writeFile(
      path.join(dir, 'rules.ts'),
      [
        "const title = 'Dangerous eval() usage';",
        "const description = 'document.write() can inject arbitrary HTML.';",
        '// eval() executes arbitrary code — never do this',
        '/*',
        ' * element.innerHTML = userInput is an XSS sink.',
        ' */',
        'const help = `avoid eval() and document.write() in templates`;',
        'export { title, description, help };',
      ].join('\n'),
    );
    await writeFile(
      path.join(dir, 'offset.ts'),
      [
        '/*',
        ' * Historically this used eval().',
        ' * Two more lines of prose.',
        ' */',
        'export function run(src: string) {',
        '  return eval(src);',
        '}',
      ].join('\n'),
    );
    await writeFile(
      path.join(dir, 'real.ts'),
      [
        'export function boom(src: string) {',
        '  return eval(src);',
        '}',
        // biome-ignore lint/suspicious/noTemplateCurlyInString: source text for the scanner to read
        'export const out = `result: ${eval(src)}`;',
      ].join('\n'),
    );
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('does not flag dangerous constructs named in strings or comments', async () => {
    const f = await securityCheck.run(dir);
    expect(f.filter((x) => x.file === 'rules.ts')).toEqual([]);
  });

  it('reports the real line number after a multi-line comment', async () => {
    const f = await securityCheck.run(dir);
    expect(f.find((x) => x.file === 'offset.ts')).toMatchObject({ line: 6 });
  });

  it('still flags the real call in executable code', async () => {
    const f = await securityCheck.run(dir);
    expect(f.map((x) => `${x.title} ${x.file}:${x.line}`)).toEqual([
      'Dangerous eval() usage offset.ts:6',
      'Dangerous eval() usage real.ts:2',
      'Dangerous eval() usage real.ts:4',
    ]);
  });
});

describe('securityCheck handles regex literals', () => {
  let dir: string;

  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'security-regex-'));
    // A regex literal holding a backtick must not put the stripper into
    // template mode and blank the rest of the file.
    await writeFile(
      path.join(dir, 'backtick.ts'),
      ['const markdown = /`([^`]+)`/g;', 'export function boom(src: string) {', '  return eval(src);', '}'].join('\n'),
    );
    // Division must not be read as the start of a regex literal.
    await writeFile(
      path.join(dir, 'division.ts'),
      ['const ratio = total / count;', 'eval(src);', 'const other = a / b;'].join('\n'),
    );
    // A regex that merely contains the text of a dangerous call is not a call.
    await writeFile(path.join(dir, 'pattern.ts'), ['const re = /warn|eval(x)/;'].join('\n'));
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('still finds code after a regex literal containing a backtick', async () => {
    const f = await securityCheck.run(dir);
    expect(f.map((x) => `${x.file}:${x.line}`)).toContain('backtick.ts:3');
  });

  it('still finds code between two divisions', async () => {
    const f = await securityCheck.run(dir);
    expect(f.map((x) => `${x.file}:${x.line}`)).toContain('division.ts:2');
  });

  it('does not report the text inside a regex literal', async () => {
    const f = await securityCheck.run(dir);
    expect(f.filter((x) => x.file === 'pattern.ts')).toEqual([]);
  });
});
