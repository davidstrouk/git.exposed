import { test, expect } from '@playwright/test';

test.describe('git.exposed API smoke tests', () => {
  test('badge endpoint returns SVG', async ({ request }) => {
    const response = await request.get('/badge/expressjs/express');
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('image/svg');
  });

  test('scan API returns error for invalid URL', async ({ request }) => {
    const response = await request.post('/api/scan', {
      data: { url: 'not-a-github-url' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('fix API requires authentication', async ({ request }) => {
    const response = await request.post('/api/fix', {
      data: { scanId: 'fake', findingIds: ['fake'] },
    });
    expect(response.status()).toBe(401);
  });

  test('checkout API requires authentication', async ({ request }) => {
    const response = await request.get('/api/checkout');
    expect(response.status()).toBe(401);
  });

  test('report page is accessible', async ({ request }) => {
    const response = await request.get('/expressjs/express');
    expect(response.status()).toBe(200);
  });

  test('webhook rejects invalid signature', async ({ request }) => {
    const response = await request.post('/api/webhook/github', {
      data: { repository: { full_name: 'test/repo' } },
      headers: {
        'x-hub-signature-256': 'sha256=invalid',
        'x-github-event': 'push',
      },
    });
    expect(response.status()).toBe(401);
  });
});
