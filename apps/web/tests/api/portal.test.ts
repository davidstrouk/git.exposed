import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@repo/shared/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@repo/shared/db/schema', () => ({
  subscriptions: { userId: 'user_id' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col, val) => ({ col, val })),
}));

import { GET } from '@/app/api/portal/route';
import { auth } from '@/lib/auth';
import { db } from '@repo/shared/db';

function makeRequest(): Request {
  return new Request('https://git.exposed/api/portal', { method: 'GET' });
}

describe('GET /api/portal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 404 when no subscription exists', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'u1' } });

    const mockChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('redirects to customer portal URL', async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'u1' } });

    const portalUrl = 'https://my-store.lemonsqueezy.com/billing?expires=123&signature=abc';
    const mockChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ customerPortalUrl: portalUrl }]),
    };
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

    const res = await GET();
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(portalUrl);
  });
});
