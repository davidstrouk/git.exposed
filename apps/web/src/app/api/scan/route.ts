import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@repo/shared/db';
import { scans, accounts, subscriptions } from '@repo/shared/db/schema';
import { eq, and, desc, gt } from 'drizzle-orm';
import { parseGitHubUrl } from '@repo/shared/github';
import { isValidRepoName } from '@repo/shared/validation';
import { runScan } from '@/scanner/run-scan';
import { rateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';

export const maxDuration = 60;

const SCANNER_URL = process.env.SCANNER_BACKEND_URL;
const SCAN_SECRET = process.env.SCAN_SECRET || '';

async function isRepoPublic(owner: string, repo: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !data.private;
  } catch {
    return false;
  }
}

async function getUserGitHubToken(userId: string): Promise<string | null> {
  const [account] = await db.select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, 'github')))
    .limit(1);
  return account?.access_token || null;
}

async function hasProSubscription(userId: string): Promise<boolean> {
  const [sub] = await db.select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
    .limit(1);
  return !!sub;
}

export async function POST(request: Request) {
  // Rate limit: 5 scans per minute per IP
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed, remaining } = rateLimit(ip, 5, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many scans. Please wait a minute.' },
      { status: 429, headers: { 'Retry-After': '60', 'X-RateLimit-Remaining': '0' } },
    );
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { url } = body;
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const info = parseGitHubUrl(url);
  if (!info) {
    return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
  }

  if (!isValidRepoName(info.owner) || !isValidRepoName(info.repo)) {
    return NextResponse.json({ error: 'Invalid owner or repo name' }, { status: 400 });
  }

  // Check if repo is public or private
  const isPublic = await isRepoPublic(info.owner, info.repo);
  let accessToken: string | undefined;

  if (!isPublic) {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Sign in with GitHub to scan private repositories.' },
        { status: 401 },
      );
    }

    const isPro = await hasProSubscription(session.user.id);
    if (!isPro) {
      return NextResponse.json(
        { error: 'Private repo scanning requires a Pro subscription.', upgrade: true },
        { status: 403 },
      );
    }

    const token = await getUserGitHubToken(session.user.id);
    if (!token) {
      return NextResponse.json(
        { error: 'GitHub access token not found. Please sign out and sign in again.' },
        { status: 401 },
      );
    }
    accessToken = token;
  }

  // Deduplication: return recent scan if same repo scanned in last 5 minutes
  const fiveMinAgo = new Date(Date.now() - 5 * 60_000);
  const [recent] = await db.select().from(scans)
    .where(and(
      eq(scans.repoOwner, info.owner),
      eq(scans.repoName, info.repo),
      eq(scans.status, 'complete'),
      gt(scans.createdAt, fiveMinAgo),
    ))
    .orderBy(desc(scans.createdAt)).limit(1);

  if (recent) {
    return NextResponse.json({
      id: recent.id,
      status: recent.status,
      score: recent.score,
      grade: recent.grade,
      findingsCount: recent.findingsCount,
      reportUrl: `/${info.owner}/${info.repo}`,
      cached: true,
    }, { headers: { 'X-RateLimit-Remaining': String(remaining) } });
  }

  const [scan] = await db.insert(scans).values({
    repoOwner: info.owner,
    repoName: info.repo,
    repoUrl: `https://github.com/${info.owner}/${info.repo}`,
  }).returning();

  if (SCANNER_URL) {
    // Delegate to scanning backend (Betterleaks + OpenGrep + Trivy)
    try {
      const res = await fetch(`${SCANNER_URL}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SCAN_SECRET}`,
        },
        body: JSON.stringify({
          scanId: scan.id,
          owner: info.owner,
          repo: info.repo,
          ...(accessToken && { accessToken }),
        }),
      });
      if (!res.ok) throw new Error(`Scanner returned ${res.status}`);
    } catch (error) {
      console.error('Scanner backend error, falling back to built-in:', error);
      await runScan(scan.id, info.owner, info.repo, accessToken);
    }
  } else {
    // Fallback: built-in regex checks on Vercel
    await runScan(scan.id, info.owner, info.repo, accessToken);
  }

  const [result] = await db.select().from(scans).where(eq(scans.id, scan.id));

  return NextResponse.json({
    id: scan.id,
    status: result.status,
    score: result.score,
    grade: result.grade,
    findingsCount: result.findingsCount,
    reportUrl: `/${info.owner}/${info.repo}`,
  });
}
