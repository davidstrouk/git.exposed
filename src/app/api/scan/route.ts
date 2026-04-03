import { NextResponse } from 'next/server';
import { db } from '@/db';
import { scans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { parseGitHubUrl } from '@/scanner/github';
import { runScan } from '@/scanner/run-scan';

export const maxDuration = 60;

export async function POST(request: Request) {
  const { url } = await request.json();

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

  // Run scan synchronously — wait for completion before responding
  await runScan(scan.id, info.owner, info.repo);

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
