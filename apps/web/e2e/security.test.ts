import { test, expect } from '@playwright/test';

test.describe('security headers and input validation', () => {
  test('scan API rejects path traversal attempts', async ({ request }) => {
    const response = await request.post('/api/scan', {
      data: { url: 'https://github.com/../etc/passwd' },
    });
    // 400 (invalid URL) or 429 (rate limited) — must not return 200
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('scan API rejects non-GitHub URLs', async ({ request }) => {
    const response = await request.post('/api/scan', {
      data: { url: 'https://gitlab.com/owner/repo' },
    });
    // 400 (invalid URL) or 429 (rate limited)
    expect([400, 429]).toContain(response.status());
  });
});
