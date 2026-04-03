import { db } from '@repo/shared/db';
import { scans, findings as findingsTable } from '@repo/shared/db/schema';
import { eq } from 'drizzle-orm';
import { downloadRepo } from '@repo/shared/github';
import { calculateScore, getGrade } from '@repo/shared/scoring';
import { runBetterleaks } from './scanners/betterleaks';
import { runOpengrep } from './scanners/opengrep';
import { runTrivy } from './scanners/trivy';
import { rm } from 'node:fs/promises';
import type { Finding } from '@repo/shared/types';

export async function runDeepScan(scanId: string, owner: string, repo: string) {
  let dir: string | undefined;

  try {
    await db.update(scans).set({ status: 'scanning' }).where(eq(scans.id, scanId));

    dir = await downloadRepo(owner, repo);

    // Run all three scanners concurrently (async exec, non-blocking)
    const [secrets, sast, deps] = await Promise.all([
      runBetterleaks(dir),
      runOpengrep(dir),
      runTrivy(dir),
    ]);

    const allFindings = [...secrets, ...sast, ...deps].map((f) => ({
      ...f,
      // Strip temp directory prefix — show repo-relative paths
      file: f.file.startsWith(dir!) ? f.file.slice(dir!.length + 1) : f.file,
    }));
    const score = calculateScore(allFindings);
    const grade = getGrade(score);

    if (allFindings.length > 0) {
      await db.insert(findingsTable).values(
        allFindings.map((f) => ({
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
      findingsCount: allFindings.length,
      completedAt: new Date(),
    }).where(eq(scans.id, scanId));
  } catch (error) {
    console.error('Deep scan failed:', error instanceof Error ? error.message : 'Unknown error');
    await db.update(scans).set({ status: 'failed' }).where(eq(scans.id, scanId));
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
