const VERSION = 'zg-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/assets/images/hero.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then(c => c.addAll(ASSETS).catch(err => {
      console.log('[SW] Cache failed for some assets:', err);
    }))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== VERSION ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // Skip API calls and Supabase
  if (url.pathname.includes('/api/') || 
      url.hostname.includes('supabase') ||
      url.hostname.includes('umami') ||
      url.hostname.includes('baidu')) {
    return;
  }
  
  // Cache-first for same-origin static assets
  if (url.origin === location.origin) {
    if (url.pathname.match(/\.(?:js|css|jpg|jpeg|png|webp|avif|webm|svg|woff2?)$/)) {
      e.respondWith(
        caches.match(e.request).then(res => res || fetch(e.request).then(r => {
          const copy = r.clone();
          caches.open(VERSION).then(c => c.put(e.request, copy));
          return r;
        }).catch(() => caches.match('/offline.html')))
      );
      return;
    }
  }
  
  // Network-first for everything else
  e.respondWith(
    fetch(e.request).catch(() => 
      caches.match(e.request).then(r => r || caches.match('/'))
    )
  );
});
