import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';

// Mock DB before importing the route
vi.mock('@repo/shared/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock('@repo/shared/db/schema', () => ({
  subscriptions: { lsSubscriptionId: 'ls_subscription_id', userId: 'user_id' },
  users: { email: 'email' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col, val) => ({ col, val })),
}));

import { POST } from '@/app/api/webhook/lemonsqueezy/route';
import { db } from '@repo/shared/db';

function makeSignature(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function makeRequest(body: string, signature?: string): Request {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (signature) headers['x-signature'] = signature;
  return new Request('https://git.exposed/api/webhook/lemonsqueezy', {
    method: 'POST',
    headers,
    body,
  });
}

const SECRET = 'test-webhook-secret-1234567890';

describe('Lemon Squeezy webhook', () => {
  beforeEach(() => {
    vi.stubEnv('LEMONSQUEEZY_WEBHOOK_SECRET', SECRET);
    vi.clearAllMocks();

    // Default mock chain for DB operations
    const mockChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      set: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
    };
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);
  });

  it('rejects requests without a signature', async () => {
    const body = JSON.stringify({ meta: { event_name: 'subscription_created' } });
    const req = makeRequest(body);
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it('rejects requests with an invalid signature', async () => {
    const body = JSON.stringify({ meta: { event_name: 'subscription_created' } });
    const req = makeRequest(body, 'invalid-signature-value-here-xx');
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it('accepts requests with a valid signature', async () => {
    const body = JSON.stringify({
      meta: { event_name: 'subscription_created', custom_data: { user_id: 'user-123' } },
      data: {
        id: 'sub-1',
        attributes: {
          customer_id: 'cust-1',
          variant_id: 'var-1',
          renews_at: '2026-05-01T00:00:00.000Z',
          urls: { customer_portal: 'https://portal.example.com' },
        },
      },
    });
    const signature = makeSignature(body, SECRET);
    const req = makeRequest(body, signature);
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });

  it('handles subscription_created with custom user_id', async () => {
    const body = JSON.stringify({
      meta: { event_name: 'subscription_created', custom_data: { user_id: 'user-123' } },
      data: {
        id: 'sub-1',
        attributes: {
          customer_id: 'cust-1',
          variant_id: 'var-1',
          renews_at: '2026-05-01T00:00:00.000Z',
          urls: { customer_portal: 'https://portal.example.com' },
        },
      },
    });
    const signature = makeSignature(body, SECRET);
    const req = makeRequest(body, signature);
    await POST(req as never);

    expect(db.insert).toHaveBeenCalled();
  });

  it('handles subscription_cancelled', async () => {
    const body = JSON.stringify({
      meta: { event_name: 'subscription_cancelled' },
      data: {
        id: 'sub-1',
        attributes: { status: 'cancelled', ends_at: '2026-05-01T00:00:00.000Z' },
      },
    });
    const signature = makeSignature(body, SECRET);
    const req = makeRequest(body, signature);
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(db.update).toHaveBeenCalled();
  });

  it('handles subscription_paused', async () => {
    const body = JSON.stringify({
      meta: { event_name: 'subscription_paused' },
      data: { id: 'sub-1', attributes: { status: 'paused' } },
    });
    const signature = makeSignature(body, SECRET);
    const req = makeRequest(body, signature);
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(db.update).toHaveBeenCalled();
  });

  it('handles unknown event gracefully', async () => {
    const body = JSON.stringify({
      meta: { event_name: 'order_created' },
      data: { id: '1', attributes: {} },
    });
    const signature = makeSignature(body, SECRET);
    const req = makeRequest(body, signature);
    const res = await POST(req as never);
    expect(res.status).toBe(200);
  });
});
