// UniverCert · Service Worker · Sprint 16
// Cache-first pra static + verify pages (read-only offline)

const CACHE_NAME = 'uc-v1';
const OFFLINE_URL = '/';

// Pre-cache mínimo no install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)),
  );
  self.skipWaiting();
});

// Limpa caches antigos no activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

// Strategy: network-first pra HTML, cache-first pra static
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Não interceptar API/dashboard (precisa sempre fresco)
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/queue') || url.pathname.startsWith('/credentials') || url.pathname.startsWith('/recipients') || url.pathname.startsWith('/templates') || url.pathname.startsWith('/workflows') || url.pathname.startsWith('/team') || url.pathname.startsWith('/billing') || url.pathname.startsWith('/integrations') || url.pathname.startsWith('/audit')) return;

  // /v/<id> pages — cache-first (verify pages)
  if (url.pathname.startsWith('/v/')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          // Atualiza em background
          fetch(req).then((res) => {
            if (res.ok) caches.open(CACHE_NAME).then((c) => c.put(req, res.clone()));
          }).catch(() => {});
          return cached;
        }
        return fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          }
          return res;
        }).catch(() => caches.match(OFFLINE_URL));
      }),
    );
    return;
  }

  // Static assets — cache-first
  if (req.destination === 'style' || req.destination === 'script' || req.destination === 'image' || req.destination === 'font') {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        }
        return res;
      })),
    );
    return;
  }

  // Default: network-first com fallback
  event.respondWith(
    fetch(req).catch(() => caches.match(req).then((cached) => cached || caches.match(OFFLINE_URL))),
  );
});
