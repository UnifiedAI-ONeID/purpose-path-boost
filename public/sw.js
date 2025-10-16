/* ZhenGrowth SW — v10 */
const VERSION = 'v10';
const STATIC = `static-${VERSION}`;
const PAGES = `pages-${VERSION}`;
const API = `api-${VERSION}`;

const PRECACHE = ['/', '/coaching', '/offline.html', '/app-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(STATIC);
    await c.addAll(PRECACHE);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => ![STATIC, PAGES, API].includes(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* Helpers */
const isHTML = (req) => req.method === 'GET' && req.headers.get('accept')?.includes('text/html');
const isAPI = (url) => url.pathname.startsWith('/api/');
const isCal = (url) => url.hostname.endsWith('cal.com') || url.pathname.startsWith('/api/cal') || (url.pathname.startsWith('/api/coaching') && url.pathname.endsWith('/availability'));
const isPayment = (url) => url.pathname.startsWith('/api/coaching/checkout') || (url.pathname.startsWith('/coaching/') && (url.search.includes('paid=1') || url.search.includes('cancel=1')));

/* Fetch strategy */
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Never cache mutations, checkout, cal
  if (e.request.method !== 'GET' || isPayment(url) || isCal(url)) return;

  // API → SWR (60s)
  if (isAPI(url)) {
    e.respondWith((async () => {
      const cache = await caches.open(API);
      const hit = await cache.match(e.request);
      const net = fetch(e.request).then(r => {
        if (r.ok) cache.put(e.request, r.clone());
        return r;
      }).catch(() => hit);
      return hit || net;
    })());
    return;
  }

  // HTML → NetworkFirst → cache → offline
  if (isHTML(e.request)) {
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
        return hit || caches.match('/offline.html');
      }
    })());
    return;
  }

  // Static → CacheFirst
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
});

/* Background Sync: send queued leads when online */
self.addEventListener('sync', (e) => {
  if (e.tag === 'leadSync') {
    e.waitUntil(flushLeadQueue());
  }
});

async function flushLeadQueue() {
  try {
    const db = await openDB('zg-queue', 1);
    const tx = db.transaction('leads', 'readwrite');
    const all = await tx.store.getAll();
    for (const item of all) {
      try {
        const r = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload)
        });
        if (r.ok) await tx.store.delete(item.id);
      } catch (e) { }
    }
    await tx.done;
    db.close();
  } catch (e) { }
}

/* tiny IndexedDB helper (inline to avoid extra import) */
function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('leads')) {
        db.createObjectStore('leads', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(wrapDB(req.result));
    req.onerror = () => reject(req.error);
  });
}

function wrapDB(db) {
  return {
    transaction(store, mode) {
      const tx = db.transaction(store, mode);
      const st = tx.objectStore(store);
      return {
        store: {
          add: (v) => promisify(st.add(v)),
          getAll: () => promisify(st.getAll()),
          delete: (k) => promisify(st.delete(k))
        },
        done: new Promise((res, rej) => {
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        })
      };
    },
    close: () => db.close()
  };
}

function promisify(req) {
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
