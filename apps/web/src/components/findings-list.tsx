'use client';

import { useState } from 'react';
import { FindingCard } from '@/components/finding-card';
import type { GroupedFinding } from '@/lib/group-findings';
import { cn } from '@/lib/utils';

interface Props {
  findings: GroupedFinding[];
  categories: { category: string; count: number }[];
  owner: string;
  repo: string;
}

const SEV_LIST = ['critical', 'high', 'medium', 'low'] as const;
const SEV_COLORS: Record<string, { on: string; off: string }> = {
  critical: { on: 'bg-red-700 text-white', off: 'bg-red-700/20 text-red-400/60' },
  high: { on: 'bg-orange-700 text-white', off: 'bg-orange-700/20 text-orange-400/60' },
  medium: { on: 'bg-yellow-700 text-white', off: 'bg-yellow-700/20 text-yellow-400/60' },
  low: { on: 'bg-blue-700 text-white', off: 'bg-blue-700/20 text-blue-400/60' },
};

export function FindingsList({ findings, categories, owner, repo }: Props) {
  // Default: critical and high on, medium and low off
  const [activeSev, setActiveSev] = useState<Set<string>>(new Set(['critical', 'high']));
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const sevCounts: Record<string, number> = {};
  for (const g of findings) {
    sevCounts[g.severity] = (sevCounts[g.severity] ?? 0) + 1;
  }

  function toggleSev(sev: string) {
    setActiveSev((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) {
        next.delete(sev);
      } else {
        next.add(sev);
      }
      return next;
    });
  }

  const filtered = findings.filter((g) => {
    if (activeSev.size > 0 && !activeSev.has(g.severity)) return false;
    if (activeCategory && g.category !== activeCategory) return false;
    return true;
  });

  const repoUrl = `https://github.com/${owner}/${repo}`;

  return (
    <>
      {/* Severity toggle pills */}
      <div className="flex gap-2 justify-center flex-wrap mb-6">
        {SEV_LIST.map((sev) => {
          if (!sevCounts[sev]) return null;
          const isOn = activeSev.has(sev);
          return (
            <button
              type="button"
              key={sev}
              onClick={() => toggleSev(sev)}
              className={cn(
                'text-xs font-semibold px-3 py-1 rounded-full transition-all',
                isOn ? SEV_COLORS[sev].on : SEV_COLORS[sev].off,
              )}
            >
              {sevCounts[sev]} {sev}
            </button>
          );
        })}
      </div>

      {/* Category filter tabs */}
      {categories.length > 1 && (
        <div className="flex gap-2 justify-center flex-wrap mb-8">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-lg border transition-colors',
              !activeCategory
                ? 'border-slate-500 text-slate-200 bg-ds-muted'
                : 'border-ds-border/30 text-slate-400 hover:text-slate-200',
            )}
          >
            All ({findings.length})
          </button>
          {categories.map((c) => (
            <button
              type="button"
              key={c.category}
              onClick={() => setActiveCategory(activeCategory === c.category ? null : c.category)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-lg border transition-colors',
                activeCategory === c.category
                  ? 'border-slate-500 text-slate-200 bg-ds-muted'
                  : 'border-ds-border/30 text-slate-400 hover:text-slate-200',
              )}
            >
              {c.category} ({c.count})
            </button>
          ))}
        </div>
      )}

      {/* Filtered count */}
      {(activeSev.size > 0 && activeSev.size < 4) || activeCategory ? (
        <p className="text-xs text-slate-500 text-center mb-4">
          Showing {filtered.length} of {findings.length} issues
        </p>
      ) : null}

      {/* Findings */}
      <div className="space-y-3">
        {filtered.map((g) => (
          <FindingCard key={`${g.severity}::${g.title}`} finding={g} repoUrl={repoUrl} />
        ))}
        {filtered.length === 0 && findings.length > 0 && (
          <p className="text-center text-slate-500 text-sm py-8">No issues match the current filters.</p>
        )}
      </div>
    </>
  );
}
