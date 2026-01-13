
import { logger as log } from '@/lib/log';

// Service Worker Registration
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          log.debug('SW registered', { scope: registration.scope });
        })
        .catch(error => {
          log.error('SW registration failed', { error });
        });
    });
  }
};

// Push Notification Subscription
const handlePushNotifications = () => {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    log.debug('Push notifications not supported');
    return;
  }

  // Request permission if needed
  if (Notification.permission === 'default') {
    log.debug('Push notification permission not requested yet');
  } else if (Notification.permission === 'granted') {
    log.debug('Push notifications enabled');
    subscribeToPush();
  } else {
    log.debug('Push notifications denied');
  }
};

// Subscribe to push notifications
const subscribeToPush = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
      ),
    });
    log.debug('Push subscription created', { subscription });
    // Send subscription to server
    await sendSubscriptionToServer(subscription);
  } catch (error) {
    log.error('Failed to subscribe to push notifications', { error });
  }
};

// Convert base64 VAPID key to Uint8Array
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

// Send subscription to backend
const sendSubscriptionToServer = async (subscription: PushSubscription) => {
  try {
    const deviceId = localStorage.getItem('zg.device') || `device-${Date.now()}`;
    localStorage.setItem('zg.device', deviceId);
    
    await fetch('/api/pwa/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: deviceId,
        subscription: subscription.toJSON()
      })
    });
    log.debug('Push subscription sent to server', { deviceId });
  } catch (error) {
    log.error('Failed to send subscription to server', { error });
  }
};

// Online/Offline Event Handling
const handleConnectionEvents = () => {
  window.addEventListener('online', () => {
    log.debug('App is online');
    // Optionally, trigger data sync or notify user
  });

  window.addEventListener('offline', () => {
    log.debug('App is offline');
    // Optionally, switch to offline mode or notify user
  });
};

/**
 * Initializes all PWA-related functionalities.
 */
export const initPwa = () => {
  log.debug('Initializing PWA modules');
  registerServiceWorker();
  handlePushNotifications();
  handleConnectionEvents();
};
