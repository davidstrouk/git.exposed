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

const MAX_REPO_SIZE = 100 * 1024 * 1024; // 100MB
const FETCH_TIMEOUT = 30000; // 30s

async function fetchAndExtract(url: string, dir: string, headers?: Record<string, string>): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url, { redirect: 'follow', signal: controller.signal, headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentLength = Number(res.headers.get('content-length') || 0);
    if (contentLength > MAX_REPO_SIZE) throw new Error('Repository too large');

    const webStream = res.body;
    if (!webStream) throw new Error('No response body');

    const nodeStream = Readable.fromWeb(webStream as any);
    await pipeline(
      nodeStream,
      tar.x({ cwd: dir, strip: 1, filter: (_path, entry) => !('type' in entry && entry.type === 'SymbolicLink') }),
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function downloadRepo(owner: string, repo: string, accessToken?: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'gitexposed-'));
  const headers: Record<string, string> = accessToken
    ? { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' }
    : {};

  // Authenticated requests use the GitHub API tarball endpoint
  const baseUrl = accessToken
    ? `https://api.github.com/repos/${owner}/${repo}/tarball`
    : `https://github.com/${owner}/${repo}/archive/refs/heads`;

  try {
    const url = accessToken ? baseUrl : `${baseUrl}/main.tar.gz`;
    await fetchAndExtract(url, dir, headers);
  } catch {
    const entries = await readdir(dir);
    await Promise.all(entries.map((e) => rm(path.join(dir, e), { recursive: true, force: true })));
    if (accessToken) {
      // API tarball uses default branch, so if it failed, just rethrow
      throw new Error('Failed to download private repository');
    }
    await fetchAndExtract(`${baseUrl}/master.tar.gz`, dir, headers);
  }

  return dir;
}
