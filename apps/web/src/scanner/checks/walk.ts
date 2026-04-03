import { readdir } from 'node:fs/promises';
import path from 'node:path';

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', '.next', 'build', 'coverage',
  '__pycache__', '.venv', 'venv',
]);

const CODE_EXTS = new Set([
  '.js', '.ts', '.jsx', '.tsx', '.py', '.rb', '.go', '.java', '.php',
  '.env', '.json', '.yaml', '.yml', '.toml', '.sh',
]);

export async function walk(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name) || e.isSymbolicLink()) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...await walk(full));
    else if (CODE_EXTS.has(path.extname(e.name))) files.push(full);
  }
  return files;
}
