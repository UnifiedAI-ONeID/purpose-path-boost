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
  | 'booking_initiated'
  // Payment
  | 'pay_click'
  | 'pay_success'
  | 'pay_fail'
  | 'payment_initiated'
  | 'payment_redirect'
  | 'payment_failed'
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
  | 'cta_click'
  | 'page_view';

export interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

export const track = async (eventName: EventName, properties?: EventProperties) => {
  // Track with Umami
  if (typeof window !== 'undefined' && window.umami && typeof window.umami === 'function') {
    try {
      window.umami(eventName, properties);
    } catch (e) {
      console.error('[Analytics] Umami error:', e);
    }
  }

  // Track with PostHog
  if (typeof window !== 'undefined' && window.posthog && typeof window.posthog.capture === 'function') {
    try {
      window.posthog.capture(eventName, properties);
    } catch (e) {
      console.error('[Analytics] PostHog error:', e);
    }
  }

  // Development logging
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${eventName}`, properties);
  }

  // Save to database for admin dashboard
  try {
    const { supabase } = await import('@/db'; import { dbClient as supabase } from '@/db');
    
    // Generate session ID if not exists (guarded for privacy modes)
    let sessionId = '';
    try {
      sessionId = sessionStorage.getItem('analytics_session_id') || '';
    } catch {}
    if (!sessionId) {
      try {
        sessionId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      } catch {
        sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }
      try { sessionStorage.setItem('analytics_session_id', sessionId); } catch {}
    }

    await supabase.from('analytics_events').insert({
      event_name: eventName,
      properties: properties || {},
      session_id: sessionId,
      page_url: window.location.href,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    // Fail silently - analytics shouldn't break the app
    if (import.meta.env.DEV) {
      console.error('[Analytics] Failed to save event:', error);
    }
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
