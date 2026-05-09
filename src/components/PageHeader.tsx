// UniverCert · PageHeader GODMODE 2.0 — minimalista, sem ícone gradient

type Props = {
  icon?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
};

export default function PageHeader({ icon, title, subtitle, actions, badge }: Props) {
  return (
    <header className="page-header animate-fade-in">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {icon && (
            <span className="text-lg leading-none opacity-70" aria-hidden>{icon}</span>
          )}
          <h1 className="page-title">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
    </header>
  );
}
