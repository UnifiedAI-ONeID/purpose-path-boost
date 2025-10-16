// Analytics utilities for Umami and PostHog

export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>
) => {
  // Track with Umami
  if (typeof window !== 'undefined' && typeof window.umami === 'function') {
    try {
      window.umami(eventName, properties);
    } catch (e) {
      console.error('[Analytics] Umami error:', e);
    }
  }

  // Track with PostHog if enabled
  if (typeof window !== 'undefined' && window.posthog && typeof window.posthog.capture === 'function') {
    try {
      window.posthog.capture(eventName, properties);
    } catch (e) {
      console.error('[Analytics] PostHog error:', e);
    }
  }

  // Development logging
  if (import.meta.env.DEV) {
    console.log('[Analytics]', eventName, properties);
  }
};

export const identifyUser = (
  userId: string,
  properties?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.posthog && typeof window.posthog.identify === 'function') {
    try {
      window.posthog.identify(userId, properties);
    } catch (e) {
      console.error('[Analytics] PostHog identify error:', e);
    }
  }

  if (import.meta.env.DEV) {
    console.log('[Analytics] Identify', userId, properties);
  }
};
