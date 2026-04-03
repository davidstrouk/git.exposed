import { describe, it, expect } from 'vitest';
import { parseGitHubUrl, downloadRepo } from '@repo/shared/github';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';

describe('parseGitHubUrl', () => {
  it('parses full GitHub URL', () => {
    const result = parseGitHubUrl('https://github.com/owner/repo');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('parses URL with trailing slash', () => {
    const result = parseGitHubUrl('https://github.com/owner/repo/');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('parses URL with .git suffix', () => {
    const result = parseGitHubUrl('https://github.com/owner/repo.git');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('parses URL with deep path', () => {
    const result = parseGitHubUrl('https://github.com/owner/repo/tree/main/src');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('returns null for non-GitHub URLs', () => {
    expect(parseGitHubUrl('https://gitlab.com/owner/repo')).toBeNull();
  });

  it('returns null for invalid input', () => {
    expect(parseGitHubUrl('not-a-url')).toBeNull();
  });
});

describe('downloadRepo', () => {
  it('downloads a real public repo as tarball', async () => {
    const dir = await downloadRepo('octocat', 'Hello-World');
    expect(existsSync(dir)).toBe(true);
    await rm(dir, { recursive: true, force: true });
  }, 30000);
});
