'use client';

import { useState } from 'react';

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs font-mono px-3 py-1.5 rounded border transition-colors cursor-pointer"
      style={{
        borderColor: copied ? '#16a34a' : '#334155',
        color: copied ? '#16a34a' : '#94a3b8',
        background: copied ? 'rgba(22, 163, 74, 0.1)' : 'transparent',
      }}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}
