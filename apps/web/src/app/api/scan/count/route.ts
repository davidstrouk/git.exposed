import { db } from '@repo/shared/db';
import { scans } from '@repo/shared/db/schema';
import { countDistinct, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  const [result] = await db
    .select({ count: countDistinct(sql`(${scans.repoOwner}, ${scans.repoName})`) })
    .from(scans)
    .where(eq(scans.status, 'complete'));
  return NextResponse.json(
    { count: result.count },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  );
}
