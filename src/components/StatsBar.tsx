// UniverCert · StatsBar · GODMODE pattern

type Stat = {
  label: string;
  value: string | number;
  icon?: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'gold';
  hint?: string;
};

const TONES: Record<string, { bg: string; fg: string }> = {
  primary: { bg: 'bg-primary-soft', fg: 'text-primary-dark' },
  success: { bg: 'bg-success/10', fg: 'text-success' },
  warning: { bg: 'bg-warning/10', fg: 'text-warning' },
  danger: { bg: 'bg-danger/10', fg: 'text-danger' },
  gold: { bg: 'bg-gold/10', fg: 'text-amber-700' },
};

export default function StatsBar({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-fade-in stagger-1">
      {stats.map((s, i) => {
        const tone = TONES[s.tone ?? 'primary'];
        return (
          <div key={i} className="card !p-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
            {s.icon && (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${tone.bg} ${tone.fg}`}>
                {s.icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold truncate">{s.label}</div>
              <div className="text-xl font-extrabold text-ink-900 mt-0.5 tracking-tight truncate">{s.value}</div>
              {s.hint && <div className="text-[11px] text-ink-500 mt-0.5">{s.hint}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
