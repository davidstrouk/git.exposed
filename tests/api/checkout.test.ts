import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock deps before importing
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@lemonsqueezy/lemonsqueezy.js', () => ({
  lemonSqueezySetup: vi.fn(),
  createCheckout: vi.fn(),
}));

import { POST } from '@/app/api/checkout/route';
import { auth } from '@/lib/auth';
import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js';

function makeRequest(): Request {
  return new Request('https://git.exposed/api/checkout', { method: 'POST' });
}

describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('LEMONSQUEEZY_API_KEY', 'test-key');
    vi.stubEnv('LEMONSQUEEZY_STORE_ID', '1');
    vi.stubEnv('LEMONSQUEEZY_VARIANT_ID', '1');
  });

  it('returns 401 when not authenticated', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await POST(makeRequest() as never);
    expect(res.status).toBe(401);
  });

  it('returns 401 when session has no email', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: '1' } });
    const res = await POST(makeRequest() as never);
    expect(res.status).toBe(401);
  });

  it('returns checkout URL on success', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'u1', email: 'test@example.com', name: 'Test' },
    });
    (createCheckout as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { data: { attributes: { url: 'https://checkout.lemonsqueezy.com/test' } } },
    });

    const res = await POST(makeRequest() as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toBe('https://checkout.lemonsqueezy.com/test');
  });

  it('returns 500 when checkout creation fails', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'u1', email: 'test@example.com' },
    });
    (createCheckout as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { data: { attributes: { url: null } } },
    });

    const res = await POST(makeRequest() as never);
    expect(res.status).toBe(500);
  });
});
