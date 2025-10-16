/* ZhenGrowth SW — v9 (bump this to invalidate old caches) */
const VERSION = 'v9';
const STATIC_CACHE = `static-${VERSION}`;
const PAGES_CACHE  = `pages-${VERSION}`;
const API_CACHE    = `api-${VERSION}`;

/* Precache essentials (keep tiny) */
const PRECACHE_URLS = [
  '/', '/coaching', '/offline.html',
  '/app-icon.png', '/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(STATIC_CACHE);
    await c.addAll(PRECACHE_URLS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => ![STATIC_CACHE,PAGES_CACHE,API_CACHE].includes(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* Navigation preload for faster SSR/edge responses */
self.addEventListener('activate', () => {
  if ('navigationPreload' in self.registration) self.registration.navigationPreload.enable();
});

/* Helpers */
const isHTML = (req) => req.method === 'GET' && req.headers.get('accept')?.includes('text/html');
const isAPI  = (url) => url.pathname.startsWith('/api/');
const isCal  = (url) => url.hostname.endsWith('cal.com') || url.pathname.startsWith('/api/cal') || url.pathname.startsWith('/api/coaching') && url.pathname.endsWith('/availability');
const isAirwallexFlow = (url) => url.pathname.startsWith('/api/coaching/checkout') || (url.pathname.startsWith('/coaching/') && (url.search.includes('paid=1') || url.search.includes('cancel=1')));

/* Runtime strategies:
   - HTML pages → NetworkFirst (fallback cache → /offline.html)
   - /api/coaching/* (availability/price) → StaleWhileRevalidate (60s)
   - Mutations / checkout / Cal.com / Airwallex return → NetworkOnly
   - Static assets → CacheFirst
*/
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Never cache checkout/Cal flow or paid return URLs
  if (e.request.method !== 'GET' || isAirwallexFlow(url) || isCal(url)) {
    return; // let network handle it
  }

  // API (GET) – SWR short cache
  if (isAPI(url)) {
    e.respondWith((async () => {
      const cache = await caches.open(API_CACHE);
      const cached = await cache.match(e.request);
      const fetchPromise = fetch(e.request).then((res) => {
        // clone & store only 200s
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })());
    return;
  }

  // HTML pages (including /coaching/*)
  if (isHTML(e.request)) {
    e.respondWith((async () => {
      const cache = await caches.open(PAGES_CACHE);
      try {
        const preloaded = await e.preloadResponse;
        if (preloaded) {
          cache.put(e.request, preloaded.clone());
          return preloaded;
        }
        const net = await fetch(e.request, { cache: 'no-store' });
        if (net?.ok) cache.put(e.request, net.clone());
        return net;
      } catch {
        const hit = await cache.match(e.request);
        return hit || caches.match('/offline.html');
      }
    })());
    return;
  }

  // Static assets – CacheFirst
  e.respondWith((async () => {
    const cache = await caches.open(STATIC_CACHE);
    const hit = await cache.match(e.request);
    if (hit) return hit;
    const res = await fetch(e.request);
    if (res.ok && (e.request.url.startsWith(self.location.origin))) {
      cache.put(e.request, res.clone());
    }
    return res;
  })());
});

/* Background Sync for leads (optional) */
self.addEventListener('sync', async (e) => {
  if (e.tag === 'leadSync') {
    e.waitUntil((async () => {
      // implement IndexedDB queue flush here if needed
    })());
  }
});
