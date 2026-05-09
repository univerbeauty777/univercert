'use client';

// UniverCert · Sticky CTA flutuante (aparece após scroll)

import { useEffect, useState } from 'react';

export default function StickyCTA({ message = 'Testar grátis em 30s', href = '/demo' }: { message?: string; href?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 animate-slide-up no-print">
      <a
        href={href}
        className="group flex items-center gap-3 px-6 py-3.5 rounded-full bg-gradient-to-r from-primary via-primary to-accent text-white shadow-glow-primary hover:shadow-glow-gold transition-all hover:scale-105"
      >
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <span className="font-bold text-sm">🧪 {message}</span>
        <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
      </a>
    </div>
  );
}
