'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const SCAN_PHASES = [
  'Connecting to GitHub',
  'Downloading repository',
  'Scanning for secrets',
  'Analyzing dependencies',
  'Running security checks',
];

const PHASE_INTERVAL = 3000;

interface AutoScanProps {
  owner: string;
  repo: string;
}

export function AutoScan({ owner, repo }: AutoScanProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [error, setError] = useState('');
  const [scanComplete, setScanComplete] = useState(false);
  const router = useRouter();
  const hasStarted = useRef(false);

  // Advance through scan phases for visual progress (goal-gradient effect)
  useEffect(() => {
    if (scanComplete || error) return;

    const timer = setInterval(() => {
      setCurrentPhase((prev) =>
        prev >= SCAN_PHASES.length - 1 ? prev : prev + 1,
      );
    }, PHASE_INTERVAL);

    return () => clearInterval(timer);
  }, [scanComplete, error]);

  // Trigger scan on mount
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    (async () => {
      try {
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: `https://github.com/${owner}/${repo}` }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Scan failed');
          return;
        }

        if (data.status === 'complete') {
          setScanComplete(true);
          setCurrentPhase(SCAN_PHASES.length);
          setTimeout(() => router.refresh(), 800);
        } else {
          setError('Scan failed. Is this a valid repository?');
        }
      } catch {
        setError('Something went wrong. Please try again.');
      }
    })();
  }, [owner, repo, router]);

  return (
    <div className="text-center">
      <p className="text-base text-slate-300 font-mono mb-10">{owner}/{repo}</p>

      {error ? (
        <div className="max-w-md mx-auto">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
          <a
            href="/"
            className="text-red-500 hover:text-red-400 font-semibold text-sm"
          >
            &larr; Scan a different repo
          </a>
        </div>
      ) : (
        <div className="max-w-sm mx-auto">
          <div className="space-y-4 text-left mb-8">
            {SCAN_PHASES.map((label, i) => {
              const isComplete = i < currentPhase || scanComplete;
              const isCurrent = i === currentPhase && !scanComplete;
              const isPending = i > currentPhase && !scanComplete;

              return (
                <div
                  key={label}
                  className={`flex items-center gap-3 transition-opacity duration-500 ${
                    isPending ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  <span className="w-6 h-6 flex items-center justify-center">
                    {isComplete ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isCurrent ? (
                      <svg className="animate-spin w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-600 mx-auto" />
                    )}
                  </span>
                  <span
                    className={`text-sm ${
                      isComplete
                        ? 'text-slate-300'
                        : isCurrent
                          ? 'text-slate-200 font-medium'
                          : 'text-slate-500'
                    }`}
                  >
                    {label}
                    {isCurrent ? '...' : ''}
                  </span>
                </div>
              );
            })}
          </div>

          {scanComplete ? (
            <p className="text-green-500 text-sm font-medium animate-pulse">
              Scan complete — loading results…
            </p>
          ) : (
            <p className="text-slate-500 text-xs">
              This usually takes 10–30 seconds
            </p>
          )}
        </div>
      )}
    </div>
  );
}
