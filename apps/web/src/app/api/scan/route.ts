import { db } from '@repo/shared/db';
import { scans } from '@repo/shared/db/schema';
import { parseGitHubUrl } from '@repo/shared/github';
import { isValidRepoName } from '@repo/shared/validation';
import { and, desc, eq, gt } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { runScan } from '@/scanner/run-scan';

export const maxDuration = 60;

const SCANNER_URL = process.env.SCANNER_BACKEND_URL;
const SCAN_SECRET = process.env.SCAN_SECRET || '';

// biome-ignore lint/suspicious/noControlCharactersInRegex: stripping control chars is the point
const sanitize = (s: string) => s.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 256);

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
    console.warn('[scan] rejected', { ip, reason: 'invalid-json' });
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { url } = body;
  if (!url || typeof url !== 'string') {
    console.warn('[scan] rejected', { ip, reason: 'missing-url' });
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const info = parseGitHubUrl(url);
  if (!info) {
    console.warn('[scan] rejected', { ip, url: sanitize(url), reason: 'invalid-url' });
    return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
  }

  if (!isValidRepoName(info.owner) || !isValidRepoName(info.repo)) {
    console.warn('[scan] rejected', {
      ip,
      repo: `${sanitize(info.owner)}/${sanitize(info.repo)}`,
      reason: 'invalid-name',
    });
    return NextResponse.json({ error: 'Invalid owner or repo name' }, { status: 400 });
  }

  const cacheCutoff = new Date(Date.now() - 24 * 60 * 60_000);
  const [recent] = await db
    .select()
    .from(scans)
    .where(
      and(
        eq(scans.repoOwner, info.owner),
        eq(scans.repoName, info.repo),
        eq(scans.status, 'complete'),
        gt(scans.createdAt, cacheCutoff),
      ),
    )
    .orderBy(desc(scans.createdAt))
    .limit(1);

  if (recent) {
    return NextResponse.json(
      {
        id: recent.id,
        status: recent.status,
        score: recent.score,
        grade: recent.grade,
        findingsCount: recent.findingsCount,
        reportUrl: `/${info.owner}/${info.repo}`,
        cached: true,
      },
      { headers: { 'X-RateLimit-Remaining': String(remaining) } },
    );
  }

  const [scan] = await db
    .insert(scans)
    .values({
      repoOwner: info.owner,
      repoName: info.repo,
      repoUrl: `https://github.com/${info.owner}/${info.repo}`,
    })
    .returning();

  if (SCANNER_URL) {
    console.log(`[web] Delegating scan to backend: ${SCANNER_URL}/scan for ${info.owner}/${info.repo}`);
    try {
      const res = await fetch(`${SCANNER_URL}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SCAN_SECRET}`,
        },
        body: JSON.stringify({ scanId: scan.id, owner: info.owner, repo: info.repo }),
      });
      if (!res.ok) throw new Error(`Scanner returned ${res.status}`);
      console.log(`[web] Backend accepted scan for ${info.owner}/${info.repo}`);
    } catch (error) {
      console.error('[web] Scanner backend error, falling back to built-in:', error);
      await runScan(scan.id, info.owner, info.repo);
    }
  } else {
    console.log(`[web] No SCANNER_BACKEND_URL — using built-in scanner for ${info.owner}/${info.repo}`);
    await runScan(scan.id, info.owner, info.repo);
  }

  // Return immediately — scan may still be running in the backend
  return NextResponse.json({
    id: scan.id,
    status: 'scanning',
    reportUrl: `/${info.owner}/${info.repo}`,
  });
}
