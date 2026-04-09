import { timingSafeEqual } from 'node:crypto';
import { serve } from '@hono/node-server';
import { isValidRepoName } from '@repo/shared/validation';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
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

  if (!isValidRepoName(owner) || !isValidRepoName(repo)) {
    return c.json({ error: 'Invalid owner or repo name' }, 400);
  }

  // Fire-and-forget — scan runs in background, frontend polls for status
  runDeepScan(scanId, owner, repo).catch(() => {});

  return c.json({ status: 'accepted', scanId });
});

// API_PORT for explicit override; PORT for Railway production (where API_PORT isn't set).
// Default 4000 for local dev. This avoids PORT=3030 conflicts when both
// Next.js and Hono run in the same turbo dev session.
const port = Number(process.env.API_PORT) || (process.env.TURBO_HASH ? 4000 : Number(process.env.PORT) || 4000);
console.log(`Scanner backend running on port ${port}`);
serve({ fetch: app.fetch, port });

export default app;
