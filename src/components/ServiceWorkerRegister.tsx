'use client';

// UniverCert · Service Worker register (Sprint 16 PWA)

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    // Não registra em dev local pra evitar dor de cabeça com HMR
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return;
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((err) => console.warn('[sw] register failed:', err));
  }, []);
  return null;
}
