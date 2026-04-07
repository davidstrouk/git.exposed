'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanCount, setScanCount] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/scan/count').then((r) => r.json()).then((d) => setScanCount(d.count)).catch(() => {});
  }, []);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      if (data.status === 'complete') {
        router.push(data.reportUrl);
      } else {
        setError('Scan failed. Is this a valid repository?');
        setLoading(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background text-slate-200 flex items-center px-6">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center py-20">

        {/* Left column — messaging */}
        <div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-none mb-6 hero-glow">
            git.<span className="text-red-500">exposed</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-3 max-w-[50ch]">
            Find exposed secrets and vulnerabilities in any GitHub repo.
          </p>
          <p className="text-sm text-slate-400 mb-8">
            150+ secret patterns &middot; 3,000+ security rules &middot; Real CVE database
          </p>

          <form onSubmit={handleScan} className="flex gap-3 mb-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              required
              aria-label="GitHub repository URL"
              className="flex-1 bg-ds-primary border border-ds-border rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/60 focus:border-transparent transition-all duration-200"
            />
            <button
              type="submit"
              disabled={loading}
              aria-label="Scan repository"
              className="bg-green-700 hover:bg-green-600 disabled:bg-slate-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 active:scale-[0.97] flex items-center gap-2 shadow-[0_4px_14px_rgba(34,197,94,0.25)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.35)]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Scanning...
                </>
              ) : 'Scan'}
            </button>
          </form>

          {/* Quick-start examples */}
          <div className="flex gap-3 flex-wrap mb-6">
            <span className="text-xs text-slate-400">Try:</span>
            {['expressjs/express', 'facebook/react', 'vercel/next.js'].map((repo) => (
              <button
                key={repo}
                onClick={() => setUrl(`https://github.com/${repo}`)}
                className="text-xs text-slate-400 hover:text-green-400 transition-colors duration-150 font-mono active:scale-[0.97]"
              >
                {repo}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          <p className="text-sm text-slate-400">
            Free for public repos &middot; No signup required
            {scanCount !== null && (
              <span> &middot; {scanCount.toLocaleString()} repos scanned</span>
            )}
          </p>
        </div>

        {/* Right column — visual element */}
        <div className="hidden md:flex items-center justify-center">
          <div className="relative">
            {/* Terminal-style preview card */}
            <div className="bg-ds-muted/80 border border-ds-border/40 rounded-2xl p-6 w-[340px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs text-slate-400 ml-2 font-mono">scan results</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded bg-red-700 text-white">critical</span>
                  <span className="text-sm text-slate-300">Hardcoded API key</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-700 text-white">high</span>
                  <span className="text-sm text-slate-300">SQL injection risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded bg-yellow-700 text-white">medium</span>
                  <span className="text-sm text-slate-300">Outdated dependency</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-ds-border/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Score</span>
                  <span className="text-sm font-bold text-red-400 font-mono">F — 12/100</span>
                </div>
              </div>
            </div>

            {/* Decorative glow behind card */}
            <div className="absolute -inset-8 bg-red-500/5 blur-3xl rounded-full -z-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
