export function registerSW() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  // Enforce HTTPS in production (allow localhost for development)
  if (location.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(location.hostname)) {
    console.warn('[PWA] Service Worker requires HTTPS. Redirecting...');
    location.replace(location.href.replace('http:', 'https:'));
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('[PWA] Service Worker registered');

      // Update flow
      reg.onupdatefound = () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.onstatechange = () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            const reload = confirm('ZhenGrowth updated. Reload now?');
            if (reload) location.reload();
          }
        };
      };
    } catch { }
  });
}
