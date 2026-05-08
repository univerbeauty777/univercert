// UniverCert · EmptyState · GODMODE pattern

type Props = {
  icon: string;
  title: string;
  description?: string;
  cta?: { label: string; href: string };
};

export default function EmptyState({ icon, title, description, cta }: Props) {
  return (
    <div className="card text-center py-14 animate-fade-in">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-soft via-white to-accent/10 flex items-center justify-center text-4xl mx-auto mb-5 shadow-card-hover">
        {icon}
      </div>
      <p className="font-display text-2xl font-semibold text-ink-900 mb-2 tracking-tight">{title}</p>
      {description && <p className="text-sm text-ink-500 mb-6 max-w-md mx-auto leading-relaxed">{description}</p>}
      {cta && <a href={cta.href} className="btn-primary text-sm px-6 py-2.5">{cta.label}</a>}
    </div>
  );
}
