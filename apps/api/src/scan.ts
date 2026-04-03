import { db } from './db';
import { scans, findings as findingsTable } from './db/schema';
import { eq } from 'drizzle-orm';
import { downloadRepo } from './github';
import { runBetterleaks } from './scanners/betterleaks';
import { runOpengrep } from './scanners/opengrep';
import { runTrivy } from './scanners/trivy';
import { rm } from 'node:fs/promises';
import type { Finding } from './scanners/types';

const DEDUCTIONS: Record<string, number> = { critical: 25, high: 15, medium: 8, low: 3, info: 0 };

function calculateScore(findings: Finding[]): number {
  const total = findings.reduce((sum, f) => sum + (DEDUCTIONS[f.severity] ?? 0), 0);
  return Math.max(0, 100 - total);
}

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

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
      file: f.file.startsWith(dir) ? f.file.slice(dir.length + 1) : f.file,
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
