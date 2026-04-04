const GRADE_COLORS: Record<string, string> = {
  A: '#16a34a', B: '#65a30d', C: '#ca8a04', D: '#ea580c', F: '#dc2626',
};

export function ScoreCircle({ grade, score }: { grade: string; score: number }) {
  const color = GRADE_COLORS[grade] ?? '#6b7280';
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div
          className="flex items-center justify-center w-36 h-36 rounded-full border-[5px] transition-all duration-300"
          style={{ borderColor: color, boxShadow: `0 0 30px ${color}25, 0 0 60px ${color}10` }}
        >
          <span className="text-5xl font-extrabold tracking-tighter" style={{ color }}>{grade}</span>
        </div>
      </div>
      <div className="text-2xl font-bold font-mono tracking-tight" style={{ color }}>{score}/100</div>
      <div className="text-sm text-slate-400 tracking-wide uppercase text-[0.7rem] font-medium">Vibe Safety Score</div>
    </div>
  );
}
