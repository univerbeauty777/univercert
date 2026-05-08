// UniverCert · PageHeader · GODMODE pattern

type Props = {
  icon: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export default function PageHeader({ icon, title, subtitle, actions }: Props) {
  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-3 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-accent flex items-center justify-center text-white text-xl shadow-glow-primary">
          {icon}
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight leading-tight text-ink-900">
            {title}
          </h1>
          {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
