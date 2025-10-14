// Unified analytics event tracking for Umami + PostHog

export type EventName =
  // Lead Magnet
  | 'lm_view'
  | 'lm_submit'
  | 'quiz_complete'
  // Booking
  | 'book_view'
  | 'book_start'
  | 'book_complete'
  // Payment
  | 'pay_click'
  | 'pay_success'
  | 'pay_fail'
  // Blog
  | 'blog_read'
  | 'blog_category_click'
  // Engagement
  | 'session_bucket_under30s'
  | 'session_bucket_1m'
  | 'session_bucket_3m'
  | 'session_bucket_5m_plus'
  // Navigation
  | 'nav_click'
  | 'cta_click';

export interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

export const track = (eventName: EventName, properties?: EventProperties) => {
  // Track with Umami
  if (window.umami) {
    window.umami(eventName, properties);
  }

  // Track with PostHog
  if (window.posthog) {
    window.posthog.capture(eventName, properties);
  }

  // Development logging
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${eventName}`, properties);
  }
};

// Session duration tracking
let sessionStartTime: number | null = null;

export const initSessionTracking = () => {
  sessionStartTime = Date.now();

  // Track on page unload
  window.addEventListener('beforeunload', () => {
    if (!sessionStartTime) return;

    const duration = Date.now() - sessionStartTime;
    const durationSeconds = Math.floor(duration / 1000);

    let bucketEvent: EventName;
    if (durationSeconds < 30) {
      bucketEvent = 'session_bucket_under30s';
    } else if (durationSeconds < 60) {
      bucketEvent = 'session_bucket_1m';
    } else if (durationSeconds < 180) {
      bucketEvent = 'session_bucket_3m';
    } else {
      bucketEvent = 'session_bucket_5m_plus';
    }

    track(bucketEvent, { duration: durationSeconds });
  });
};

// Auto-init on load
if (typeof window !== 'undefined') {
  initSessionTracking();
}
