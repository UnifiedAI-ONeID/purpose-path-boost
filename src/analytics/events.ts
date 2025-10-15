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
  if (typeof window !== 'undefined' && window.umami) {
    try {
      window.umami(eventName, properties);
    } catch (e) {
      console.error('[Analytics] Umami error:', e);
    }
  }

  // Track with PostHog
  if (typeof window !== 'undefined' && window.posthog) {
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
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Generate session ID if not exists
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
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
