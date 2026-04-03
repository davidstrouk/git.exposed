import type { Check, Finding } from '../types';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

export const dependenciesCheck: Check = {
  name: 'dependencies',
  async run(directory) {
    const findings: Finding[] = [];
    const pkgPath = path.join(directory, 'package.json');
    try { await access(pkgPath); } catch { return findings; }
    const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (Object.keys(deps).length === 0) return findings;
    let hasLock = false;
    for (const f of ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb']) {
      try { await access(path.join(directory, f)); hasLock = true; break; } catch {}
    }
    if (!hasLock) {
      findings.push({
        checkName: 'dependencies', severity: 'medium',
        title: 'No lockfile found',
        description: 'No package-lock.json or similar. Builds are not reproducible. Run `npm install` to generate one.',
        file: 'package.json',
      });
    }
    return findings;
  },
};
