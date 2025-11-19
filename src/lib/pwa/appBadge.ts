// App Badge API for notification badges on PWA icon

interface AppBadgeAPI {
  set: (count: number) => Promise<boolean>;
  clear: () => Promise<boolean>;
  isSupported: () => boolean;
}

function isSupported(): boolean {
  return typeof navigator !== 'undefined' && 'setAppBadge' in navigator;
}

async function setBadge(count: number): Promise<boolean> {
  if (!isSupported()) {
    console.warn('[App Badge] API not supported');
    return false;
  }

  try {
    if (count > 0) {
      await (navigator as any).setAppBadge(count);
      console.log(`[App Badge] Set to ${count}`);
    } else {
      await (navigator as any).clearAppBadge();
      console.log('[App Badge] Cleared');
    }
    return true;
  } catch (error) {
    console.error('[App Badge] Failed to set badge:', error);
    return false;
  }
}

async function clearBadge(): Promise<boolean> {
  if (!isSupported()) return false;

  try {
    await (navigator as any).clearAppBadge();
    console.log('[App Badge] Cleared');
    return true;
  } catch (error) {
    console.error('[App Badge] Failed to clear badge:', error);
    return false;
  }
}

// Create the API object
export const appBadge: AppBadgeAPI = {
  set: setBadge,
  clear: clearBadge,
  isSupported
};

// Helper to sync badge with unread count from localStorage or state
export function syncBadgeWithUnreadCount(storageKey: string = 'zg.unread.count') {
  if (!isSupported()) return;

  try {
    const count = parseInt(localStorage.getItem(storageKey) || '0', 10);
    if (count > 0) {
      appBadge.set(count);
    } else {
      appBadge.clear();
    }
  } catch (error) {
    console.error('[App Badge] Failed to sync with unread count:', error);
  }
}

// Update unread count and badge
export function updateUnreadCount(count: number, storageKey: string = 'zg.unread.count') {
  try {
    localStorage.setItem(storageKey, count.toString());
    appBadge.set(count);
  } catch (error) {
    console.error('[App Badge] Failed to update unread count:', error);
  }
}

// Increment unread count
export function incrementUnreadCount(storageKey: string = 'zg.unread.count') {
  try {
    const current = parseInt(localStorage.getItem(storageKey) || '0', 10);
    const newCount = current + 1;
    updateUnreadCount(newCount, storageKey);
  } catch (error) {
    console.error('[App Badge] Failed to increment unread count:', error);
  }
}

// Clear unread count and badge
export function clearUnreadCount(storageKey: string = 'zg.unread.count') {
  try {
    localStorage.removeItem(storageKey);
    appBadge.clear();
  } catch (error) {
    console.error('[App Badge] Failed to clear unread count:', error);
  }
}
