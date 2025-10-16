export function registerSW() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('[PWA] Service Worker registered');
        
        // Update flow
        reg.onupdatefound = () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.onstatechange = () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              // Show a toast to reload for latest features
              const reload = confirm('ZhenGrowth updated. Reload now?');
              if (reload) window.location.reload();
            }
          };
        };
      })
      .catch(() => { /* ignore registration errors */ });
  });
}
