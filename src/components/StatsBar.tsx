// UniverCert · StatsBar GODMODE 2.0 — usa stat-card class

type Stat = {
  label: string;
  value: string | number;
  icon?: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'gold';
  hint?: string;
};

export default function StatsBar({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {stats.map((s, i) => (
        <div
          key={i}
          className="stat-card animate-slide-up"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <div className="stat-label">{s.label}</div>
          <div className="stat-value">{s.value}</div>
          {s.hint && <div className="stat-hint">{s.hint}</div>}
        </div>
      ))}
    </div>
  );
}
