// Push Notifications for PWA

export type PermissionState = 'granted' | 'denied' | 'default';

interface PushSubscriptionOptions {
  userVisibleOnly: boolean;
  applicationServerKey: string;
}

export async function checkNotificationPermission(): Promise<PermissionState> {
  if (!('Notification' in window)) {
    console.warn('[Push] Notification API not supported');
    return 'denied';
  }

  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('[Push] Notification API not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[Push] Permission result:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('[Push] Failed to request permission:', error);
    return false;
  }
}

export async function subscribeToPushNotifications(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('[Push] Already subscribed');
      return subscription;
    }

    // Request permission if not granted
    const permission = await requestNotificationPermission();
    if (!permission) {
      console.warn('[Push] Notification permission denied');
      return null;
    }

    // Subscribe to push
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    } as PushSubscriptionOptionsInit);

    console.log('[Push] Subscribed successfully');
    return subscription;
  } catch (error) {
    console.error('[Push] Failed to subscribe:', error);
    return null;
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      const successful = await subscription.unsubscribe();
      console.log('[Push] Unsubscribed:', successful);
      return successful;
    }
    
    return false;
  } catch (error) {
    console.error('[Push] Failed to unsubscribe:', error);
    return false;
  }
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('[Push] Failed to get subscription:', error);
    return null;
  }
}

// Show a local notification (doesn't require push)
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  const permission = await checkNotificationPermission();
  if (permission !== 'granted') {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/app-icon-192.png',
        badge: '/app-icon-192.png',
        ...options
      });
    } else {
      new Notification(title, {
        icon: '/app-icon-192.png',
        badge: '/app-icon-192.png',
        ...options
      });
    }
    
    console.log('[Push] Local notification shown:', title);
    return true;
  } catch (error) {
    console.error('[Push] Failed to show notification:', error);
    return false;
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Send subscription to backend
export async function sendSubscriptionToBackend(
  subscription: PushSubscription
): Promise<boolean> {
  try {
    const { supabase } = await import('@/db'; import { dbClient as supabase } from '@/db');
    
    const { data, error } = await supabase.functions.invoke('pwa-push-subscribe', {
      body: {
        subscription: subscription.toJSON(),
        device_id: localStorage.getItem('zg.device')
      }
    });

    if (error) {
      console.error('[Push] Failed to send subscription to backend:', error);
      return false;
    }

    console.log('[Push] Subscription sent to backend');
    return true;
  } catch (error) {
    console.error('[Push] Failed to send subscription to backend:', error);
    return false;
  }
}
