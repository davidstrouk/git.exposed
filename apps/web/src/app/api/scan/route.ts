import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@repo/shared/db';
import { scans } from '@repo/shared/db/schema';
import { eq, and, desc, gt } from 'drizzle-orm';
import { parseGitHubUrl } from '@repo/shared/github';
import { isValidRepoName } from '@repo/shared/validation';
import { runScan } from '@/scanner/run-scan';
import { rateLimit } from '@/lib/rate-limit';

export const maxDuration = 60;

const SCANNER_URL = process.env.SCANNER_BACKEND_URL;
const SCAN_SECRET = process.env.SCAN_SECRET || '';

export async function POST(request: Request) {
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
    try {
      const res = await fetch(`${SCANNER_URL}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SCAN_SECRET}`,
        },
        body: JSON.stringify({ scanId: scan.id, owner: info.owner, repo: info.repo }),
      });
      if (!res.ok) throw new Error(`Scanner returned ${res.status}`);
    } catch (error) {
      console.error('Scanner backend error, falling back to built-in:', error);
      await runScan(scan.id, info.owner, info.repo);
    }
  } else {
    await runScan(scan.id, info.owner, info.repo);
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
