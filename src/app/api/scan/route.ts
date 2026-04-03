import { NextResponse } from 'next/server';
import { db } from '@/db';
import { scans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { parseGitHubUrl } from '@/scanner/github';
import { runScan } from '@/scanner/run-scan';

export const maxDuration = 60;

const SCANNER_URL = process.env.SCANNER_BACKEND_URL;
const SCAN_SECRET = process.env.SCAN_SECRET || '';

export async function POST(request: Request) {
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

  const [scan] = await db.insert(scans).values({
    repoOwner: info.owner,
    repoName: info.repo,
    repoUrl: url,
  }).returning();

  if (SCANNER_URL) {
    // Phase 2: delegate to scanning backend (Betterleaks + OpenGrep + Trivy)
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
    // Phase 1 fallback: built-in regex checks on Vercel
    await runScan(scan.id, info.owner, info.repo);
  }

  const [result] = await db.select().from(scans).where(eq(scans.id, scan.id));

  return NextResponse.json({
    id: scan.id,
    status: result.status,
    score: result.score,
    grade: result.grade,
    findingsCount: result.findingsCount,
    reportUrl: `/r/${info.owner}/${info.repo}`,
  });
}
