import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import * as tar from 'tar';

export interface RepoInfo {
  owner: string;
  repo: string;
}

export function parseGitHubUrl(url: string): RepoInfo | null {
  try {
    const u = new URL(url);
    if (u.hostname !== 'github.com') return null;
    const parts = u.pathname.replace(/\.git$/, '').split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

async function fetchAndExtract(url: string, dir: string): Promise<void> {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const webStream = res.body;
  if (!webStream) throw new Error('No response body');

  const nodeStream = Readable.fromWeb(webStream as any);
  await pipeline(
    nodeStream,
    tar.x({ cwd: dir, strip: 1 }),
  );
}

export async function downloadRepo(owner: string, repo: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'gitexposed-'));

  try {
    await fetchAndExtract(`https://github.com/${owner}/${repo}/archive/refs/heads/main.tar.gz`, dir);
  } catch {
    // Clean up partial extraction before retrying with master
    const entries = await readdir(dir);
    await Promise.all(entries.map((e) => rm(path.join(dir, e), { recursive: true, force: true })));
    await fetchAndExtract(`https://github.com/${owner}/${repo}/archive/refs/heads/master.tar.gz`, dir);
  }

  return dir;
}
