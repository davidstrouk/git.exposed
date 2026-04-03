import { db } from '@/db';
import { scans, findings as findingsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { downloadRepo } from './github';
import { scan } from './engine';
import { allChecks } from './checks';
import { calculateScore, getGrade } from './scoring';
import { rm } from 'node:fs/promises';

export async function runScan(scanId: string, owner: string, repo: string) {
  let dir: string | undefined;

  try {
    await db.update(scans).set({ status: 'scanning' }).where(eq(scans.id, scanId));

    dir = await downloadRepo(owner, repo);
    const result = await scan(dir, allChecks);
    const score = calculateScore(result.findings);
    const grade = getGrade(score);

    if (result.findings.length > 0) {
      await db.insert(findingsTable).values(
        result.findings.map((f) => ({
          scanId,
          checkName: f.checkName,
          severity: f.severity,
          title: f.title,
          description: f.description,
          file: f.file,
          line: f.line,
        })),
      );
    }

    await db.update(scans).set({
      status: 'complete',
      score,
      grade,
      findingsCount: result.findings.length,
      completedAt: new Date(),
    }).where(eq(scans.id, scanId));
  } catch (error) {
    console.error('Scan failed:', error);
    await db.update(scans).set({ status: 'failed' }).where(eq(scans.id, scanId));
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
