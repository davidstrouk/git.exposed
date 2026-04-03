import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { runDeepScan } from './scan';

const app = new Hono();

app.use('*', cors({
  origin: ['https://git.exposed', 'https://viral-vibecoding.vercel.app', 'http://localhost:3000'],
}));

app.get('/health', (c) => c.json({ status: 'ok' }));

app.post('/scan', async (c) => {
  const secret = c.req.header('Authorization');
  if (secret !== `Bearer ${process.env.SCAN_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { scanId, owner, repo } = await c.req.json();
  if (!scanId || !owner || !repo) {
    return c.json({ error: 'scanId, owner, repo required' }, 400);
  }

  // Validate owner/repo format to prevent path traversal
  const validName = /^[\w.-]+$/;
  if (!validName.test(owner) || !validName.test(repo)) {
    return c.json({ error: 'Invalid owner or repo name' }, 400);
  }

  await runDeepScan(scanId, owner, repo);

  return c.json({ status: 'complete' });
});

const port = Number(process.env.PORT) || 4000;
console.log(`Scanner backend running on port ${port}`);
serve({ fetch: app.fetch, port });

export default app;
