import { readdir } from 'node:fs/promises';
import path from 'node:path';

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.next',
  'build',
  'coverage',
  '__pycache__',
  '.venv',
  'venv',
]);

// Test material is deliberately full of fake keys and unsafe calls, so reporting
// it is a false positive for the code-pattern checks. Matched against the path
// relative to the scan root, never the absolute path: scanning a repo skips its
// fixture directories, but scanning a fixture directory directly still returns
// the files inside it. `examples` is intentionally absent — example dirs do leak
// real keys.
const TEST_PATH = /(^|\/)(__)?(tests?|specs?|fixtures?|mocks?|testdata|e2e)(__)?(\/|$)|\.(test|spec)\./i;

const CODE_EXTS = new Set([
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.py',
  '.rb',
  '.go',
  '.java',
  '.php',
  '.env',
  '.json',
  '.yaml',
  '.yml',
  '.toml',
  '.sh',
]);

export interface WalkOptions {
  /**
   * Skip test, fixture and mock paths. Default true. The secrets check turns
   * this off: a committed credential is exploitable wherever it lives, so those
   * paths must still be read for it.
   */
  skipTestPaths?: boolean;
}

export async function walk(dir: string, options: WalkOptions = {}): Promise<string[]> {
  return walkFrom(dir, dir, options.skipTestPaths ?? true);
}

async function walkFrom(dir: string, root: string, skipTestPaths: boolean): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name) || e.isSymbolicLink()) continue;
    const full = path.join(dir, e.name);
    if (skipTestPaths && TEST_PATH.test(path.relative(root, full).split(path.sep).join('/'))) continue;
    if (e.isDirectory()) files.push(...(await walkFrom(full, root, skipTestPaths)));
    else if (CODE_EXTS.has(path.extname(e.name))) files.push(full);
  }
  return files;
}
