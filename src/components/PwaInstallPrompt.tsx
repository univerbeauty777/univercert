'use client';

// UniverCert · PWA install prompt (Sprint 16)
// Captura beforeinstallprompt e oferece botão custom

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'uc_pwa_dismiss';
const DISMISS_DAYS = 14;

export default function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Já dismissed recentemente?
    try {
      const last = Number(localStorage.getItem(DISMISS_KEY) ?? '0');
      if (last && Date.now() - last < DISMISS_DAYS * 24 * 3600 * 1000) return;
    } catch {}

    // Já está instalado (standalone)?
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      // Mostra após ~3s pra não interromper o flow inicial
      setTimeout(() => setVisible(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const result = await deferred.userChoice;
    if (result.outcome === 'accepted') {
      setVisible(false);
    }
    dismiss();
  };

  if (!visible || !deferred) return null;

  return (
    <div className="fixed bottom-5 left-5 right-5 md:left-auto md:right-5 md:max-w-sm z-50 animate-slide-up no-print">
      <div className="card !p-4 shadow-card-lift border-2 border-primary/30 bg-gradient-to-br from-white to-primary-soft/20 dark:from-ink-800 dark:to-ink-700">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl flex-shrink-0 shadow-glow-primary">
            📲
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm tracking-tight">Instalar UniverCert</h3>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5 leading-relaxed">
              Acesso rápido pelo home screen. Funciona offline pra ver certs já emitidos.
            </p>
            <div className="mt-3 flex gap-2">
              <button onClick={install} className="btn-primary text-xs px-3 py-1.5">
                Instalar
              </button>
              <button onClick={dismiss} className="text-xs text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-100 px-2">
                Agora não
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
