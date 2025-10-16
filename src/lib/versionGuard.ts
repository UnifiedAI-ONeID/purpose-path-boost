import { supabase } from '@/integrations/supabase/client';

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
  'supabase.',
];

export function bootVersionGuard({ pollMs = 90000 }: { pollMs?: number } = {}) {
  // 1) Realtime monitoring (instant updates)
  try {
    supabase
      .channel('content-versions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'zg_versions',
          filter: 'key=eq.content',
        },
        async () => {
          console.log('[VersionGuard] Content version updated via realtime');
          await checkAndRefresh(true);
        }
      )
      .subscribe();
  } catch (err) {
    console.warn('[VersionGuard] Realtime subscription failed:', err);
  }

  // 2) Polling fallback
  setInterval(() => checkAndRefresh(false), pollMs);

  // 3) Check once at boot after React has fully initialized (10 second delay)
  setTimeout(() => checkAndRefresh(false), 10000);

  console.log('[VersionGuard] Initialized with polling every', pollMs, 'ms');
}

async function fetchVersion(): Promise<number> {
  try {
    const response = await fetch('/api/version', { cache: 'no-store' });
    const data = await response.json();
    return Number(data?.v || 1);
  } catch (err) {
    console.warn('[VersionGuard] Failed to fetch version:', err);
    return Number(localStorage.getItem(LS_KEY) || 1);
  }
}

async function checkAndRefresh(force: boolean) {
  // Don't reload if we're still in the initial page load (within first 8 seconds)
  const pageLoadTime = performance.timing?.loadEventEnd || 0;
  const timeSinceLoad = Date.now() - pageLoadTime;
  
  if (!force && timeSinceLoad < 8000) {
    console.log('[VersionGuard] Skipping check during initial page load');
    return;
  }

  const remote = await fetchVersion();
  const local = Number(localStorage.getItem(LS_KEY) || 0);

  console.log('[VersionGuard] Version check:', { local, remote, force, timeSinceLoad });

  if (force || remote > local) {
    console.log('[VersionGuard] Version mismatch - will reload');
    localStorage.setItem(LS_KEY, String(remote));
    
    // Simple reload without aggressive cache clearing to avoid module import errors
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
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

  // 3) Clear localStorage namespaces (keep user prefs like theme/lang)
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

  // 4) Clear IndexedDB used by service worker
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

