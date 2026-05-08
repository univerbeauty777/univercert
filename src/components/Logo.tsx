// UniverCert · Logo (escudo navy + check dourado)
// Inline SVG · escala em qualquer tamanho · sem dependência externa

type Props = {
  size?: number;
  variant?: 'mark' | 'full' | 'mark-light' | 'mono';
  className?: string;
};

export default function Logo({ size = 36, variant = 'mark', className = '' }: Props) {
  if (variant === 'full') {
    return (
      <span className={`inline-flex items-center gap-2.5 ${className}`}>
        <ShieldMark size={size} />
        <span className="font-extrabold tracking-tight text-base leading-none">
          <span style={{ color: '#1B2D5E' }}>univer</span>
          <span style={{ color: '#D4A937' }}>CERT</span>
        </span>
      </span>
    );
  }

  if (variant === 'mark-light') {
    return <ShieldMark size={size} className={className} light />;
  }

  if (variant === 'mono') {
    return <ShieldMark size={size} className={className} mono />;
  }

  return <ShieldMark size={size} className={className} />;
}

function ShieldMark({
  size = 36,
  className = '',
  light = false,
  mono = false,
}: {
  size?: number;
  className?: string;
  light?: boolean;
  mono?: boolean;
}) {
  // Cores
  const navy = mono ? 'currentColor' : '#1B2D5E';
  const navyDark = mono ? 'currentColor' : '#0F1B3E';
  const gold = mono ? 'currentColor' : '#D4A937';
  const goldLight = mono ? 'currentColor' : '#E8BF4F';
  const bg = light ? 'transparent' : navy;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 110"
      width={size}
      height={size}
      className={className}
      aria-label="UniverCert"
      role="img"
    >
      <defs>
        <linearGradient id="ucShield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={navy} />
          <stop offset="100%" stopColor={navyDark} />
        </linearGradient>
        <linearGradient id="ucGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={goldLight} />
          <stop offset="100%" stopColor={gold} />
        </linearGradient>
      </defs>

      {/* Shield */}
      <path
        d="M50 4 C50 4, 18 10, 12 14 L12 52 C12 76, 28 96, 50 106 C72 96, 88 76, 88 52 L88 14 C82 10, 50 4, 50 4 Z"
        fill={light ? 'transparent' : 'url(#ucShield)'}
        stroke={light ? navy : 'none'}
        strokeWidth={light ? 4 : 0}
      />

      {/* Concentric arcs (the "labyrinth" pattern) */}
      <g fill="none" stroke="url(#ucGold)" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="50" cy="56" r="32" opacity="0.6" />
        <circle cx="50" cy="56" r="26" opacity="0.7" />
        <circle cx="50" cy="56" r="20" opacity="0.8" />
        <path d="M18 56 L26 56" />
        <path d="M74 56 L82 56" />
        <path d="M50 24 L50 30" />
        <path d="M50 82 L50 88" />
      </g>

      {/* Center circle bg */}
      <circle cx="50" cy="56" r="14" fill={navyDark} />

      {/* Check mark */}
      <path
        d="M42 56 L48 62 L60 50"
        stroke="url(#ucGold)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Decorative top stripe inside shield */}
      <path
        d="M22 18 L78 18"
        stroke="url(#ucGold)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
