'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { addTransitionType, Suspense, startTransition, useEffect, useRef, useState, ViewTransition } from 'react';
import { parseGitHubUrl } from '@/lib/parse-url';
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}

function HomeInner() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [scanCount, setScanCount] = useState<number | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Show welcome banner after Pro upgrade
  useEffect(() => {
    if (searchParams.get('welcome') === 'pro') {
      setShowWelcome(true);
      // Clean URL without reload
      window.history.replaceState({}, '', '/');
      const timer = setTimeout(() => setShowWelcome(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Scan results card animation state
  const [animPhase, setAnimPhase] = useState(0);
  const [displayScore, setDisplayScore] = useState(100);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    fetch('/api/scan/count')
      .then((r) => r.json())
      .then((d) => setScanCount(d.count))
      .catch(() => {});
  }, []);

  // Scan card animation loop
  useEffect(() => {
    const t = timersRef.current;
    const schedule = (fn: () => void, delay: number) => {
      const id = setTimeout(fn, delay);
      t.push(id);
    };

    const run = () => {
      setAnimPhase(0);
      schedule(() => setAnimPhase(1), 600); // scan line sweeps
      schedule(() => setAnimPhase(2), 1800); // finding: critical
      schedule(() => setAnimPhase(3), 2150); // finding: high
      schedule(() => setAnimPhase(4), 2500); // finding: medium
      schedule(() => setAnimPhase(5), 2900); // score counter
      schedule(run, 6400); // loop
    };

    run();
    return () => {
      t.forEach(clearTimeout);
      t.length = 0;
    };
  }, []);

  // Score counter: counts 100 → 12 when phase reaches 5
  useEffect(() => {
    if (animPhase < 5) return;
    let val = 100;
    const id = setInterval(() => {
      val -= 4;
      if (val <= 12) {
        val = 12;
        clearInterval(id);
      }
      setDisplayScore(val);
    }, 18);
    return () => {
      clearInterval(id);
      setDisplayScore(100);
    };
  }, [animPhase]);

  function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const info = parseGitHubUrl(url);
    if (!info) {
      setError('Please enter a valid GitHub URL');
      return;
    }

    // Navigate immediately — the report page shows AutoScan progress
    startTransition(() => {
      addTransitionType('nav-forward');
      router.push(`/${info.owner}/${info.repo}`);
    });
  }

  return (
    <ViewTransition
      enter={{ 'nav-back': 'nav-back', default: 'none' }}
      exit={{ 'nav-forward': 'nav-forward', default: 'none' }}
      default="none"
    >
      <div className="min-h-dvh bg-background text-slate-200 flex items-center px-6">
        {showWelcome && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-green-600/90 backdrop-blur-md text-white px-6 py-3 rounded-lg shadow-lg animate-[fade-in_0.3s_ease-out] flex items-center gap-3">
            <span className="text-lg">&#10003;</span>
            <div>
              <p className="font-semibold text-sm">Welcome to Pro!</p>
              <p className="text-xs text-green-100">Private repo scanning &amp; AI-powered fixes are now unlocked.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowWelcome(false)}
              className="ml-4 text-green-200 hover:text-white text-lg"
            >
              &times;
            </button>
          </div>
        )}
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
                aria-label="Scan repository"
                className="bg-green-700 hover:bg-green-600 disabled:bg-slate-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 active:scale-[0.97] flex items-center gap-2 shadow-[0_4px_14px_rgba(34,197,94,0.25)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.35)]"
              >
                Scan
              </button>
            </form>

            {/* Quick-start examples */}
            <div className="flex gap-3 flex-wrap mb-6">
              <span className="text-xs text-slate-400">Try:</span>
              {['expressjs/express', 'facebook/react', 'vercel/next.js'].map((repo) => (
                <button
                  type="button"
                  key={repo}
                  onClick={() => {
                    startTransition(() => {
                      addTransitionType('nav-forward');
                      router.push(`/${repo}`);
                    });
                  }}
                  className="text-xs text-slate-400 hover:text-green-400 transition-colors duration-150 font-mono active:scale-[0.97]"
                >
                  {repo}
                </button>
              ))}
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <p className="text-sm text-slate-400">
              Free for public repos &middot; No signup required
              {scanCount !== null && <span> &middot; {scanCount.toLocaleString()} repos scanned</span>}
            </p>
          </div>

          {/* Right column — animated scan results card */}
          <div className="hidden md:flex items-center justify-center">
            <div className="relative">
              {/* Terminal-style preview card */}
              <div className="bg-ds-muted/80 border border-ds-border/40 rounded-2xl p-6 w-[340px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] relative overflow-hidden">
                {/* Scan line — sweeps top-to-bottom during phase 1 */}
                {animPhase === 1 && (
                  <div
                    className="absolute inset-x-0 top-0 h-px animate-scan-sweep pointer-events-none z-10"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent, #ef4444 25%, #f97316 50%, #ef4444 75%, transparent)',
                      boxShadow: '0 0 10px 3px rgba(239,68,68,0.45)',
                    }}
                  />
                )}

                {/* Terminal chrome */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs ml-2 font-mono">
                    {animPhase === 1 && (
                      <span className="text-red-400">
                        scanning<span className="animate-pulse">▌</span>
                      </span>
                    )}
                    {animPhase >= 2 && <span className="text-slate-400">scan results</span>}
                  </span>
                </div>

                {/* Findings — stagger in one by one */}
                <div className="space-y-3">
                  <div
                    className={cn(
                      'flex items-center gap-2 transition-all duration-300 ease-out',
                      animPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1.5',
                    )}
                  >
                    <span
                      className={cn(
                        'text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded bg-red-700 text-white transition-transform duration-200',
                        animPhase >= 2 ? 'scale-100' : 'scale-75',
                      )}
                    >
                      critical
                    </span>
                    <span className="text-sm text-slate-300">Hardcoded API key</span>
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-2 transition-all duration-300 ease-out',
                      animPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1.5',
                    )}
                  >
                    <span
                      className={cn(
                        'text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-700 text-white transition-transform duration-200',
                        animPhase >= 3 ? 'scale-100' : 'scale-75',
                      )}
                    >
                      high
                    </span>
                    <span className="text-sm text-slate-300">SQL injection risk</span>
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-2 transition-all duration-300 ease-out',
                      animPhase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1.5',
                    )}
                  >
                    <span
                      className={cn(
                        'text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded bg-yellow-700 text-white transition-transform duration-200',
                        animPhase >= 4 ? 'scale-100' : 'scale-75',
                      )}
                    >
                      medium
                    </span>
                    <span className="text-sm text-slate-300">Outdated dependency</span>
                  </div>
                </div>

                {/* Score — fades in and counts down */}
                <div
                  className={cn(
                    'mt-4 pt-3 border-t border-ds-border/30 transition-all duration-400 ease-out',
                    animPhase >= 5 ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Score</span>
                    <span className="text-sm font-bold text-red-400 font-mono tabular-nums">
                      F — {displayScore}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative glow — pulses when findings are revealed */}
              <div
                className={cn(
                  'absolute -inset-8 blur-3xl rounded-full -z-10 transition-all duration-700',
                  animPhase >= 2 ? 'bg-red-500/8' : 'bg-red-500/4',
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </ViewTransition>
  );
}
