import { ImageResponse } from 'next/og';
import { db } from '@/db';
import { scans } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const GRADE_COLORS: Record<string, string> = {
  A: '#16a34a', B: '#65a30d', C: '#ca8a04', D: '#ea580c', F: '#dc2626',
};

export default async function OGImage({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;

  const [scan] = await db.select().from(scans)
    .where(and(eq(scans.repoOwner, owner), eq(scans.repoName, repo), eq(scans.status, 'complete')))
    .orderBy(desc(scans.createdAt)).limit(1);

  const grade = scan?.grade ?? '?';
  const score = scan?.score ?? 0;
  const count = scan?.findingsCount ?? 0;
  const color = GRADE_COLORS[grade] ?? '#6b7280';

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#0f172a', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 32, color: '#94a3b8', marginBottom: 20 }}>git.exposed</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 180, height: 180, borderRadius: '50%', border: `8px solid ${color}`, marginBottom: 20 }}>
          <span style={{ fontSize: 80, fontWeight: 800, color }}>{grade}</span>
        </div>
        <div style={{ fontSize: 48, fontWeight: 700, color }}>{score}/100</div>
        <div style={{ fontSize: 24, color: '#94a3b8', marginTop: 10 }}>{owner}/{repo}</div>
        <div style={{ fontSize: 20, color: '#64748b', marginTop: 8 }}>{count} issues found</div>
      </div>
    ),
    { ...size },
  );
}
