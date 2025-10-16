// Lightweight cross-tab + cross-PWA broadcast
type Payload =
  | { kind: 'theme'; value: 'light'|'dark'|'auto'; resolved: 'light'|'dark' }
  | { kind: 'lang';  value: 'en'|'zh-CN'|'zh-TW' };

const CH = 'zg-prefs';

export function postPref(p: Payload) {
  try {
    // BroadcastChannel for modern browsers
    const bc = new BroadcastChannel(CH);
    bc.postMessage(p);
    bc.close?.();
    
    // Storage-event fallback for older browsers and cross-origin scenarios
    localStorage.setItem(`__${CH}__`, JSON.stringify({ ...p, ts: Date.now() }));
  } catch (e) {
    // Silently fail if BroadcastChannel not supported
  }
}

export function onPref(handler: (p: Payload) => void) {
  // BroadcastChannel
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(CH);
    bc.onmessage = (e) => handler(e.data as Payload);
  } catch (e) {
    // BroadcastChannel not supported
  }

  // Storage fallback for cross-tab sync
  function onStorage(e: StorageEvent) {
    if (e.key === `__${CH}__` && typeof e.newValue === 'string') {
      try { 
        handler(JSON.parse(e.newValue)); 
      } catch (err) {
        // Invalid JSON, ignore
      }
    }
  }
  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener('storage', onStorage);
    try { 
      bc?.close?.(); 
    } catch (e) {
      // Cleanup failed, ignore
    }
  };
}
