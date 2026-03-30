// GILMAR OPS — Service Worker v7
// Network-first for app.js + index.html (always fresh)
// Cache-first for static assets (style.css, fonts, etc.)

const CACHE = 'gilmar-ops-v7';
const ASSETS = ['/', '/index.html', '/style.css', '/app.js', '/config.js', '/manifest.json'];
const NETWORK_FIRST = ['/app.js', '/index.html', '/'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('supabase.co') || e.request.url.includes('googleapis.com')) return;

  const url = new URL(e.request.url);

  // URLs com ?v= (versionadas) — sempre rede, nunca cache
  if (url.search.includes('v=')) {
    e.respondWith(fetch(e.request));
    return;
  }

  const isNetworkFirst = NETWORK_FIRST.some(p => url.pathname === p || url.pathname.endsWith(p));

  if (isNetworkFirst) {
    // Always try network first for main JS and HTML — no stale cache
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() =>
          caches.match(e.request).then(cached => cached || caches.match('/index.html'))
        )
    );
  } else {
    // Cache-first for CSS, fonts, images, etc.
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).catch(() => caches.match('/index.html'))
      )
    );
  }
});
