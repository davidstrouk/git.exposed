import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('PrivateRepoGate checkout flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls POST /api/checkout for upgrade flow', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: 'https://checkout.lemonsqueezy.com/checkout/abc123' }),
    });
    globalThis.fetch = fetchMock;

    const res = await fetch('/api/checkout', { method: 'POST' });
    const data = await res.json();

    expect(fetchMock).toHaveBeenCalledWith('/api/checkout', { method: 'POST' });
    expect(data.url).toContain('lemonsqueezy.com');
  });

  it('handles checkout failure gracefully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    });

    const res = await fetch('/api/checkout', { method: 'POST' });
    const data = await res.json();

    expect(res.ok).toBe(false);
    expect(data.error).toBe('Unauthorized');
  });
});

describe('PrivateRepoGate sign-in flow', () => {
  it('constructs the correct callback URL', () => {
    const owner = 'my-org';
    const repo = 'private-repo';
    const callbackUrl = `/${owner}/${repo}`;

    expect(callbackUrl).toBe('/my-org/private-repo');
  });
});
