import { test, expect } from '@playwright/test';

test.describe('API smoke tests', () => {
  test('health: badge endpoint returns SVG', async ({ request }) => {
    const response = await request.get('/badge/expressjs/express');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/svg');
  });

  test('scan: rejects invalid GitHub URL', async ({ request }) => {
    const response = await request.post('/api/scan', {
      data: { url: 'not-a-github-url' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('scan: rejects missing URL', async ({ request }) => {
    const response = await request.post('/api/scan', {
      data: {},
    });
    // 400 (missing URL) or 429 (rate limited from previous test)
    expect([400, 429]).toContain(response.status());
  });

  test('scan count: returns number', async ({ request }) => {
    const response = await request.get('/api/scan/count');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.count).toBe('number');
    expect(body.count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('page accessibility', () => {
  test('report page returns 200 for scanned repo', async ({ request }) => {
    const response = await request.get('/expressjs/express');
    expect(response.status()).toBe(200);
  });

  test('landing page returns 200', async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);
  });
});
