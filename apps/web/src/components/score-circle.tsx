const GRADE_COLORS: Record<string, string> = {
  A: '#16a34a', B: '#65a30d', C: '#ca8a04', D: '#ea580c', F: '#dc2626',
};

export function ScoreCircle({ grade, score }: { grade: string; score: number }) {
  const color = GRADE_COLORS[grade] ?? '#6b7280';
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-center justify-center w-36 h-36 rounded-full border-[6px]"
        style={{ borderColor: color }}
      >
        <span className="text-5xl font-extrabold" style={{ color }}>{grade}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>{score}/100</div>
      <div className="text-sm text-slate-400">Vibe Safety Score</div>
    </div>
  );
}
