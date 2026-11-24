/* Atelier Allaoui — Service Worker for offline caching */
const CACHE = 'allaoui-v4';
const OFFLINE = '/404.html';

/* Shell: pages + assets that make the site work offline */
const SHELL = [
  '/',
  '/shop/',
  '/contact/',
  '/assets/style.css',
  '/assets/site.js',
  '/assets/favicon.svg',
  '/og-image.jpg',
  OFFLINE
];

/* Install: pre-cache the app shell */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

/* Activate: clean old caches */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Fetch: network-first for HTML, cache-first for assets */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  /* Skip non-GET and external requests */
  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  /* HTML pages: network first, fall back to cache, then offline page */
  if (e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return r;
        })
        .catch(() =>
          caches.match(e.request).then(r => r || caches.match(OFFLINE))
        )
    );
    return;
  }

  /* Assets: cache first, then network */
  e.respondWith(
    caches.match(e.request).then(r =>
      r || fetch(e.request).then(resp => {
        /* Cache successful responses for assets */
        if (resp.ok && (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.png') || url.pathname.endsWith('.ico'))) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return resp;
      })
    )
  );
});
