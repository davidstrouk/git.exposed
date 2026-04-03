import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { db } from '@repo/shared/db';
import { scans, monitoredRepos, accounts, subscriptions } from '@repo/shared/db/schema';
import { eq, and } from 'drizzle-orm';
import { isValidRepoName } from '@repo/shared/validation';
import { Octokit } from '@octokit/rest';

const SCANNER_URL = process.env.SCANNER_BACKEND_URL;
const SCAN_SECRET = process.env.SCAN_SECRET || '';
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature || !WEBHOOK_SECRET) return false;
  const expected = 'sha256=' + createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
  if (signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('x-hub-signature-256');
  const event = request.headers.get('x-github-event');

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  if (event !== 'push') {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const payload = JSON.parse(body);
  const repoFullName = payload.repository?.full_name;
  if (!repoFullName) {
    return NextResponse.json({ error: 'Missing repository' }, { status: 400 });
  }

  const [owner, repo] = repoFullName.split('/');
  if (!isValidRepoName(owner) || !isValidRepoName(repo)) {
    return NextResponse.json({ error: 'Invalid repo name' }, { status: 400 });
  }

  // Find the monitored repo entry
  const [monitor] = await db.select().from(monitoredRepos)
    .where(and(eq(monitoredRepos.repoOwner, owner), eq(monitoredRepos.repoName, repo)))
    .limit(1);

  if (!monitor) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'not monitored' });
  }

  // Check if user still has Pro
  const [sub] = await db.select().from(subscriptions)
    .where(and(eq(subscriptions.userId, monitor.userId), eq(subscriptions.status, 'active')))
    .limit(1);

  if (!sub) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'no pro subscription' });
  }

  // Get user's GitHub token
  const [account] = await db.select().from(accounts)
    .where(and(eq(accounts.userId, monitor.userId), eq(accounts.provider, 'github')))
    .limit(1);

  // Create scan record
  const [scan] = await db.insert(scans).values({
    repoOwner: owner,
    repoName: repo,
    repoUrl: `https://github.com/${owner}/${repo}`,
  }).returning();

  // Trigger scan via backend
  if (SCANNER_URL) {
    try {
      const res = await fetch(`${SCANNER_URL}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SCAN_SECRET}`,
        },
        body: JSON.stringify({
          scanId: scan.id,
          owner,
          repo,
          ...(account?.access_token && { accessToken: account.access_token }),
        }),
      });
      if (!res.ok) throw new Error(`Scanner returned ${res.status}`);
    } catch (error) {
      console.error('Webhook scan failed:', error instanceof Error ? error.message : error);
      return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
    }
  }

  // Post commit status
  const headSha = payload.after;
  if (headSha && account?.access_token) {
    try {
      const [result] = await db.select().from(scans).where(eq(scans.id, scan.id));
      if (result?.status === 'complete' && result.grade && result.score !== null) {
        const state = ['A', 'B', 'C'].includes(result.grade) ? 'success' as const : 'failure' as const;
        const octokit = new Octokit({ auth: account.access_token });

        await octokit.repos.createCommitStatus({
          owner,
          repo,
          sha: headSha,
          state,
          target_url: `https://git.exposed/${owner}/${repo}`,
          description: `Score: ${result.score}/100 (${result.grade}) — ${result.findingsCount} issues`,
          context: 'git.exposed/security',
        });
      }
    } catch (err) {
      console.error('Commit status failed:', err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({ ok: true, scanId: scan.id });
}
