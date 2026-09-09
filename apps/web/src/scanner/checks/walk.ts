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
// it is always a false positive. Matched against the path relative to the scan
// root, never the absolute path: scanning a repo skips its fixture directories,
// but scanning a fixture directory directly still returns the files inside it.
// `examples` is intentionally absent — example dirs do leak real keys.
const TEST_PATH = /(^|\/)(tests?|__tests__|spec|fixtures?|mocks?|testdata|e2e)(\/|$)|\.(test|spec)\./i;

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

export async function walk(dir: string, root: string = dir): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name) || e.isSymbolicLink()) continue;
    const full = path.join(dir, e.name);
    if (TEST_PATH.test(path.relative(root, full).split(path.sep).join('/'))) continue;
    if (e.isDirectory()) files.push(...(await walk(full, root)));
    else if (CODE_EXTS.has(path.extname(e.name))) files.push(full);
  }
  return files;
}
