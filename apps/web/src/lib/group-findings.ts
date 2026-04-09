/**
 * Groups raw findings into deduplicated, categorized, severity-sorted results.
 *
 * Category mapping:
 *   betterleaks → "Exposed Secrets"
 *   opengrep    → "Code Security"
 *   trivy       → "Vulnerable Dependencies"
 */

interface RawFinding {
  id: string;
  checkName: string;
  severity: string;
  title: string;
  description: string;
  file: string;
  line: number | null;
}

export interface GroupedFinding {
  title: string;
  severity: string;
  category: string;
  description: string;
  files: { file: string; line: number | null }[];
  ids: string[];
}

const CATEGORY_MAP: Record<string, string> = {
  betterleaks: 'Exposed Secrets',
  opengrep: 'Code Security',
  trivy: 'Vulnerable Dependencies',
};

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const CATEGORY_ORDER: Record<string, number> = {
  'Exposed Secrets': 0,
  'Code Security': 1,
  'Vulnerable Dependencies': 2,
};

export function groupFindings(raw: RawFinding[]): GroupedFinding[] {
  const map = new Map<string, GroupedFinding>();

  for (const f of raw) {
    // Dedup key: same title + severity (e.g. same CVE across multiple lockfiles)
    const key = `${f.severity}::${f.title}`;
    const existing = map.get(key);

    if (existing) {
      // Add file location if not already present
      if (!existing.files.some((ef) => ef.file === f.file && ef.line === f.line)) {
        existing.files.push({ file: f.file, line: f.line });
      }
      existing.ids.push(f.id);
    } else {
      map.set(key, {
        title: f.title,
        severity: f.severity,
        category: CATEGORY_MAP[f.checkName] || f.checkName,
        description: f.description,
        files: [{ file: f.file, line: f.line }],
        ids: [f.id],
      });
    }
  }

  // Sort: severity first, then category, then title
  return Array.from(map.values()).sort((a, b) => {
    const sevDiff = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
    if (sevDiff !== 0) return sevDiff;
    const catDiff = (CATEGORY_ORDER[a.category] ?? 9) - (CATEGORY_ORDER[b.category] ?? 9);
    if (catDiff !== 0) return catDiff;
    return a.title.localeCompare(b.title);
  });
}

export function countByCategory(grouped: GroupedFinding[]): { category: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const g of grouped) {
    counts.set(g.category, (counts.get(g.category) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => (CATEGORY_ORDER[a.category] ?? 9) - (CATEGORY_ORDER[b.category] ?? 9));
}
