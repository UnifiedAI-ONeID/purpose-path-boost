// Analytics utilities for Umami and PostHog

declare global {
  interface Window {
    umami?: {
      (event: string, data?: Record<string, any>): void;
    };
    posthog?: {
      capture: (event: string, properties?: Record<string, any>) => void;
      identify: (userId: string, properties?: Record<string, any>) => void;
    };
  }
}

export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>
) => {
  // Track with Umami
  if (window.umami) {
    window.umami(eventName, properties);
  }

  // Track with PostHog if enabled
  if (window.posthog) {
    window.posthog.capture(eventName, properties);
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
  if (window.posthog) {
    window.posthog.identify(userId, properties);
  }

  if (import.meta.env.DEV) {
    console.log('[Analytics] Identify', userId, properties);
  }
};
