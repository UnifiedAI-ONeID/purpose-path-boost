export function registerAdminSW() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  // Only register inside the /admin scope
  if (!location.pathname.startsWith('/admin')) return;

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/admin/sw.js', { scope: '/admin/' });
      console.log('[Admin PWA] Service Worker registered');
      
      reg.onupdatefound = () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.onstatechange = () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            if (confirm('Admin updated. Reload now?')) location.reload();
          }
        };
      };
    } catch (e) {
      console.log('[Admin PWA] Registration failed:', e);
    }
  });
}
