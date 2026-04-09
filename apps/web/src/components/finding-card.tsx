import type { GroupedFinding } from '@/lib/group-findings';

const SEV_COLORS: Record<string, string> = {
  critical: '#b91c1c',
  high: '#c2410c',
  medium: '#a16207',
  low: '#1d4ed8',
  info: '#6b7280',
};

function fileUrl(repoUrl: string, file: string, line: number | null): string {
  // GitHub blob URL: repo/blob/HEAD/path#L123
  const url = `${repoUrl}/blob/HEAD/${file}`;
  return line ? `${url}#L${line}` : url;
}

export function FindingCard({ finding, repoUrl }: { finding: GroupedFinding; repoUrl?: string }) {
  const fileCount = finding.files.length;
  const showAllFiles = fileCount <= 3;
  const displayFiles = showAllFiles ? finding.files : finding.files.slice(0, 2);

  return (
    <div
      className="bg-ds-muted rounded-lg p-4 border border-ds-border/30 border-l-[3px]"
      style={{ borderLeftColor: SEV_COLORS[finding.severity] }}
    >
      <div className="flex items-start gap-2 mb-1.5">
        <span
          className="text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded text-white shrink-0 mt-0.5"
          style={{ background: SEV_COLORS[finding.severity] }}
        >
          {finding.severity}
        </span>
        <div className="min-w-0 flex-1">
          <strong className="text-sm text-slate-200 leading-snug">{finding.title}</strong>
        </div>
        <span className="text-[0.6rem] text-slate-500 font-medium uppercase tracking-wider shrink-0 mt-1">
          {finding.category}
        </span>
      </div>

      <p className="text-[0.8rem] text-slate-400 leading-relaxed mb-2">{finding.description}</p>

      <div className="text-xs font-mono space-y-0.5">
        {displayFiles.map((f, i) => {
          const label = `${f.file}${f.line ? `:${f.line}` : ''}`;
          return repoUrl ? (
            <a
              key={`${f.file}:${f.line ?? i}`}
              href={fileUrl(repoUrl, f.file, f.line)}
              target="_blank"
              rel="noopener"
              className="block truncate text-slate-400 hover:text-blue-400 transition-colors"
            >
              {label}
            </a>
          ) : (
            <div key={`${f.file}:${f.line ?? i}`} className="truncate text-slate-500">
              {label}
            </div>
          );
        })}
        {!showAllFiles && (
          <div className="text-slate-600">
            +{fileCount - 2} more {fileCount - 2 === 1 ? 'file' : 'files'}
          </div>
        )}
      </div>
    </div>
  );
}
