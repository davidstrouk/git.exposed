import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { timingSafeEqual } from 'node:crypto';
import { isValidRepoName } from '@repo/shared/validation';
import { runDeepScan } from './scan';

const SCAN_SECRET = process.env.SCAN_SECRET;
if (!SCAN_SECRET) throw new Error('SCAN_SECRET environment variable must be set');

const isDev = process.env.NODE_ENV === 'development';
const allowedOrigins = [
  'https://git.exposed',
  'https://viral-vibecoding.vercel.app',
  ...(isDev ? ['http://localhost:3000'] : []),
];

const app = new Hono();

app.use('*', cors({ origin: allowedOrigins }));

app.get('/health', (c) => c.json({ status: 'ok' }));

function verifyAuth(header: string | undefined): boolean {
  const expected = `Bearer ${SCAN_SECRET}`;
  if (!header || header.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

app.post('/scan', async (c) => {
  if (!verifyAuth(c.req.header('Authorization'))) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { scanId, owner, repo } = await c.req.json();
  if (!scanId || !owner || !repo) {
    return c.json({ error: 'scanId, owner, repo required' }, 400);
  }

  // Validate owner/repo format to prevent path traversal
  if (!isValidRepoName(owner) || !isValidRepoName(repo)) {
    return c.json({ error: 'Invalid owner or repo name' }, 400);
  }

  await runDeepScan(scanId, owner, repo);

  return c.json({ status: 'complete' });
});

const port = Number(process.env.PORT) || 4000;
console.log(`Scanner backend running on port ${port}`);
serve({ fetch: app.fetch, port });

export default app;
