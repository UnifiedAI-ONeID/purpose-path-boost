import { db } from '@/firebase/config';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';

const LS_KEY = 'zg.content.v';
const CACHE_PREFIXES = [
  'api-swr-',
  'zg-img-',
  'workbox-precache-',
  'workbox-runtime-',
  'STATIC',
  'API',
];

const LS_PREFIXES = [
  'cache:',
  'zg.pwa.',
  'zg.i18n.',
  'zg.offer.',
  'firebase.', // Changed from supabase.
];

export function bootVersionGuard({ pollMs = 90000 }: { pollMs?: number } = {}) {
  // 1) Realtime monitoring (instant updates) via Firestore
  try {
    const docRef = doc(db, 'config', 'system'); // Assuming /config/system exists
    onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        console.log('[VersionGuard] System config updated via realtime');
        // Assuming version is in 'version' field
        const version = doc.data().version;
        if (version) {
          handleVersionUpdate(Number(version));
        }
      }
    });
  } catch (err) {
    console.warn('[VersionGuard] Realtime subscription failed:', err);
  }

  // 2) Polling fallback is less critical with Firestore offline support, but good for redundancy
  // We can just fetch the doc periodically
  setInterval(() => checkAndRefresh(), pollMs);

  // 3) Initial check
  setTimeout(() => checkAndRefresh(), 5000);

  console.log('[VersionGuard] Initialized');
}

async function fetchVersion(): Promise<number> {
  try {
    const docRef = doc(db, 'config', 'system');
    const snap = await getDoc(docRef);
    return Number(snap.data()?.version || 1);
  } catch (err) {
    console.warn('[VersionGuard] Failed to fetch version:', err);
    return Number(localStorage.getItem(LS_KEY) || 1);
  }
}

async function handleVersionUpdate(remote: number) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

  const local = Number(localStorage.getItem(LS_KEY) || 0);
  console.log('[VersionGuard] Version check:', { local, remote });

  if (remote > local && local > 0) {
    console.log('[VersionGuard] Version mismatch - purging caches and reloading');
    localStorage.setItem(LS_KEY, String(remote));

    try {
      await nukeCaches();
    } catch (e) {
      console.warn('[VersionGuard] Cache purge failed, proceeding to reload', e);
    }

    setTimeout(() => {
      window.location.reload();
    }, 300);
  } else if (local === 0) {
    localStorage.setItem(LS_KEY, String(remote));
  }
}

async function checkAndRefresh() {
  const remote = await fetchVersion();
  await handleVersionUpdate(remote);
}

async function nukeCaches() {
  console.log('[VersionGuard] Nuking all caches...');

  // 1) Tell service worker to purge
  try {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage('ZG_PURGE_ALL');
      console.log('[VersionGuard] Sent purge message to service worker');
    }
  } catch (err) {
    console.warn('[VersionGuard] Failed to message service worker:', err);
  }

  // 2) Clear CacheStorage
  try {
    const cacheNames = await caches.keys();
    const matchingCaches = cacheNames.filter((name) =>
      CACHE_PREFIXES.some((prefix) => name.startsWith(prefix))
    );
    
    await Promise.all(matchingCaches.map((name) => {
      console.log('[VersionGuard] Deleting cache:', name);
      return caches.delete(name);
    }));
    
    console.log('[VersionGuard] Cleared', matchingCaches.length, 'cache(s)');
  } catch (err) {
    console.warn('[VersionGuard] Failed to clear caches:', err);
  }

  // 3) Clear localStorage namespaces
  try {
    const keysToRemove: string[] = [];
    for (const key of Object.keys(localStorage)) {
      if (LS_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach((key) => {
      console.log('[VersionGuard] Removing localStorage key:', key);
      localStorage.removeItem(key);
    });
    
    console.log('[VersionGuard] Cleared', keysToRemove.length, 'localStorage key(s)');
  } catch (err) {
    console.warn('[VersionGuard] Failed to clear localStorage:', err);
  }

  // 4) Clear IndexedDB
  try {
    const dbNames = ['workbox-expiration', 'keyval-store', 'zg-idb'];
    await Promise.all(
      dbNames.map((db) => {
        console.log('[VersionGuard] Deleting IndexedDB:', db);
        return new Promise((resolve) => {
          const request = indexedDB.deleteDatabase(db);
          request.onsuccess = () => resolve(true);
          request.onerror = () => resolve(false);
        });
      })
    );
    console.log('[VersionGuard] Cleared IndexedDB databases');
  } catch (err) {
    console.warn('[VersionGuard] Failed to clear IndexedDB:', err);
  }
}
