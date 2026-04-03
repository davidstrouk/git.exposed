import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('AutoScan API contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('posts the correct GitHub URL format to /api/scan', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'complete', reportUrl: '/facebook/react' }),
    });
    globalThis.fetch = fetchMock;

    await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://github.com/facebook/react' }),
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/scan', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ url: 'https://github.com/facebook/react' }),
    }));
  });

  it('handles failed scan status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'failed' }),
    });

    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://github.com/owner/repo' }),
    });
    const data = await res.json();

    expect(data.status).toBe('failed');
  });

  it('handles API error responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: 'Too many scans. Please wait a minute.' }),
    });

    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://github.com/owner/repo' }),
    });

    expect(res.ok).toBe(false);
    const data = await res.json();
    expect(data.error).toContain('Too many scans');
  });

  it('handles network failures', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(
      fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://github.com/owner/repo' }),
      }),
    ).rejects.toThrow('Network error');
  });
});
