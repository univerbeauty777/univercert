'use client';

// UniverCert · WhatsApp Floating Action Button
// BR converte 3x mais com WhatsApp visível.

import { useEffect, useState } from 'react';

type Props = {
  phone?: string; // E.164 sem '+': ex 5511999998888
  message?: string;
  hideOn?: string[]; // pathname prefixes onde não aparece (ex: '/uh/solicitar')
};

export default function WhatsAppFAB({
  phone = '5511999998888',
  message = 'Oi! Vim do site UniverCert e queria saber mais sobre certificados digitais para minha escola.',
  hideOn = ['/uh/solicitar', '/v/', '/sign-in', '/sign-up', '/demo'],
}: Props) {
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;
    if (hideOn.some((p) => path.startsWith(p))) return;
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, [hideOn]);

  if (!visible) return null;

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 group"
      style={{
        animation: 'fadeIn 0.4s cubic-bezier(0.4,0,0.2,1)',
      }}
      aria-label="Falar no WhatsApp"
    >
      <span
        className={`hidden md:flex bg-white rounded-full px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-lg shadow-black/10 border border-gray-200 transition-all ${
          hover ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-3 pointer-events-none'
        }`}
      >
        Fale com a gente
      </span>
      <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1EBE5A] shadow-lg shadow-[#25D366]/40 transition-transform hover:scale-105">
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="white"
          aria-hidden
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
        </svg>
      </span>
    </a>
  );
}
