'use client';

import { useState } from 'react';

interface Finding {
  id: string;
  severity: string;
  title: string;
  file: string;
}

interface Props {
  scanId: string;
  findings: Finding[];
  isPro: boolean;
}

export function FixButton({ scanId, findings, isPro }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<'idle' | 'loading' | 'polling' | 'done' | 'error'>('idle');
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === findings.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(findings.map((f) => f.id)));
    }
  };

  const handleFix = async () => {
    if (selected.size === 0) return;
    setStatus('loading');
    setError(null);

    try {
      const res = await fetch('/api/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId, findingIds: Array.from(selected) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fix request failed');
      }

      const { jobId } = await res.json();
      setStatus('polling');

      const poll = async () => {
        const pollRes = await fetch(`/api/fix/${jobId}`);
        const job = await pollRes.json();

        if (job.status === 'complete') {
          setPrUrl(job.prUrl);
          setStatus('done');
        } else if (job.status === 'failed') {
          setError(job.error || 'Fix generation failed');
          setStatus('error');
        } else {
          setTimeout(poll, 3000);
        }
      };
      poll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  };

  if (!isPro) {
    return (
      <div className="mt-6 p-5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-center">
        <p className="text-sm text-slate-300 font-medium mb-1">Fix all {findings.length} issues with one click</p>
        <p className="text-xs text-slate-500 mb-3">AI generates a PR with fixes — you just review and merge.</p>
        <a href="/api/checkout" className="inline-block bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
          Upgrade to Pro — $19/mo
        </a>
        <p className="text-[0.65rem] text-slate-600 mt-2">Less than $0.63/day &middot; Cancel anytime</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={selectAll}
          aria-label="Select all findings"
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          {selected.size === findings.length ? 'Deselect all' : 'Select all'}
        </button>
        <button
          onClick={handleFix}
          disabled={selected.size === 0 || status === 'loading' || status === 'polling'}
          aria-label={`Fix ${selected.size} selected findings`}
          className="bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {status === 'loading' ? 'Creating fix...' :
           status === 'polling' ? 'Generating PR...' :
           `Fix ${selected.size} selected`}
        </button>
      </div>

      <div className="space-y-2">
        {findings.map((f) => (
          <label
            key={f.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-ds-border/30 hover:border-ds-border bg-ds-muted/50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={selected.has(f.id)}
              onChange={() => toggle(f.id)}
              className="mt-1 accent-green-500"
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-slate-200">{f.title}</span>
              <span className="text-xs text-slate-500 block mt-0.5 font-mono truncate">{f.file}</span>
            </div>
            <span className={`text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded ${
              f.severity === 'critical' ? 'bg-red-600' :
              f.severity === 'high' ? 'bg-orange-600' :
              f.severity === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'
            } text-white`}>
              {f.severity}
            </span>
          </label>
        ))}
      </div>

      {status === 'done' && prUrl && (
        <div className="mt-4 p-4 rounded-lg border border-green-600/30 bg-green-500/10">
          <p className="text-green-400 text-sm font-semibold mb-1">PR created!</p>
          <a href={prUrl} target="_blank" rel="noopener" className="text-green-300 hover:text-green-200 text-sm underline">
            {prUrl}
          </a>
        </div>
      )}

      {status === 'error' && error && (
        <div className="mt-4 p-4 rounded-lg border border-red-600/30 bg-red-500/10">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
