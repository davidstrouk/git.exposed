const SEV_COLORS: Record<string, string> = {
  critical: '#dc2626', high: '#ea580c', medium: '#ca8a04', low: '#2563eb', info: '#6b7280',
};

interface FindingProps {
  severity: string;
  title: string;
  description: string;
  file: string;
  line?: number | null;
}

export function FindingCard({ severity, title, description, file, line }: FindingProps) {
  return (
    <div className="bg-slate-700/80 rounded-lg p-4 border border-slate-600/50 border-l-[3px]" style={{ borderLeftColor: SEV_COLORS[severity] }}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[0.65rem] font-bold uppercase px-2 py-0.5 rounded text-white"
          style={{ background: SEV_COLORS[severity] }}
        >
          {severity}
        </span>
        <strong className="text-slate-200">{title}</strong>
      </div>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
      <div className="text-xs text-slate-500 mt-2 font-mono">{file}{line ? `:${line}` : ''}</div>
    </div>
  );
}
