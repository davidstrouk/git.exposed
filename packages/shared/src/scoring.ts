import type { Finding, Severity } from './types';

const DEDUCTIONS: Record<Severity, number> = { critical: 25, high: 15, medium: 8, low: 3, info: 0 };

export function calculateScore(findings: Finding[]): number {
  const total = findings.reduce((sum, f) => sum + DEDUCTIONS[f.severity], 0);
  return Math.max(0, 100 - total);
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export function getGrade(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}
