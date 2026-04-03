'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setShowUpgrade(false);
    setLoading(true);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 && !session) {
          setError('Sign in with GitHub to scan private repositories.');
        } else if (res.status === 403 && data.upgrade) {
          setShowUpgrade(true);
          setError('');
        } else {
          setError(data.error);
        }
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

  const productId = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center px-6">
      <main className="max-w-2xl w-full text-center">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4">
          git.<span className="text-red-500">exposed</span>
        </h1>
        <p className="text-xl text-slate-400 mb-10">
          Is your code exposed? Scan any GitHub repo in seconds.
        </p>

        <form onSubmit={handleScan} className="flex gap-3 mb-6">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            required
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
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

        {error && (
          <div className="mb-4">
            <p className="text-red-400 text-sm">{error}</p>
            {!session && error.includes('Sign in') && (
              <button
                onClick={() => signIn('github')}
                className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
              >
                Sign in with GitHub →
              </button>
            )}
          </div>
        )}

        {showUpgrade && (
          <div className="mb-4 bg-slate-800/50 border border-amber-500/30 rounded-lg p-4">
            <p className="text-amber-400 text-sm font-medium mb-2">
              🔒 Private repo scanning requires a Pro subscription
            </p>
            <a
              href={`/api/checkout?products=${productId}`}
              className="inline-block bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Upgrade to Pro — $19/mo
            </a>
          </div>
        )}

        <p className="text-sm text-slate-500">
          Public repos free &middot; Private repos with Pro &middot; Open source
        </p>
      </main>
    </div>
  );
}
