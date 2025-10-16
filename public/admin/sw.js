/* ZG Admin SW — v1 (scoped to /admin/) */
const VERSION = 'admin-v1';
const STATIC = `admin-static-${VERSION}`;
const PAGES = `admin-pages-${VERSION}`;

/* Only cache the admin shell & static assets. Never cache secrets or mutations. */
const PRECACHE = ['/admin'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(STATIC);
    for (const url of PRECACHE) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await c.put(url, response);
        }
      } catch (err) {
        console.log(`[Admin SW] Failed to cache ${url}:`, err);
      }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => ![STATIC, PAGES].includes(k)).map(k => caches.delete(k)));
    await self.clients.claim();
    if ('navigationPreload' in self.registration) self.registration.navigationPreload.enable();
  })());
});

const isHTML = (req) => req.method === 'GET' && req.headers.get('accept')?.includes('text/html');
const isAdminAPI = (url) => url.pathname.startsWith('/api/admin/');
const isMutation = (req) => req.method !== 'GET';
const isSensitive = (url) =>
  isAdminAPI(url) ||
  url.pathname.startsWith('/api/cal') ||
  url.pathname.startsWith('/api/coaching/checkout') ||
  url.pathname.startsWith('/api/express') ||
  url.pathname.startsWith('/api/secrets') ||
  url.pathname.startsWith('/api/social');

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Never intercept mutations or sensitive API (force network)
  if (isMutation(e.request) || isSensitive(url)) return;

  // HTML (admin pages) → NetworkFirst with offline fallback
  if (isHTML(e.request) && url.pathname.startsWith('/admin')) {
    e.respondWith((async () => {
      const cache = await caches.open(PAGES);
      try {
        const pre = await e.preloadResponse;
        if (pre) {
          cache.put(e.request, pre.clone());
          return pre;
        }
        const net = await fetch(e.request, { cache: 'no-store' });
        if (net.ok) cache.put(e.request, net.clone());
        return net;
      } catch {
        const hit = await cache.match(e.request);
        return hit || caches.match('/admin/offline.html');
      }
    })());
    return;
  }

  // Static assets → CacheFirst
  if (e.request.method === 'GET') {
    e.respondWith((async () => {
      const cache = await caches.open(STATIC);
      const hit = await cache.match(e.request);
      if (hit) return hit;
      const net = await fetch(e.request);
      if (net.ok && e.request.url.startsWith(self.location.origin)) {
        cache.put(e.request, net.clone());
      }
      return net;
    })());
  }
});

/* Optional: Broadcast updates to clients */
self.addEventListener('message', (e) => {
  if (e.data === 'CHECK_UPDATE') {
    self.skipWaiting?.();
  }
});
