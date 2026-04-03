import { NextResponse } from 'next/server';
import { db } from '@/db';
import { scans } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [scan] = await db.select().from(scans).where(eq(scans.id, id));

  if (!scan) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: scan.id,
    status: scan.status,
    score: scan.score,
    grade: scan.grade,
    findingsCount: scan.findingsCount,
    reportUrl: `/${scan.repoOwner}/${scan.repoName}`,
  });
}
