
interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

type MetricPayloadValue = string | number | boolean | null | undefined;
type MetricPayload = Record<string, MetricPayloadValue>;

interface MetricsEvent {
  name: string;
  route?: string;
  referrer?: string;
  utm?: UtmParams;
  device?: string;
  lang?: string;
  payload?: MetricPayload;
  ts?: number;
  sessionId?: string;
}

class MetricsTracker {
  private sessionId: string;
  private queue: MetricsEvent[] = [];
  private flushTimeout: number | null = null;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  private readonly MAX_QUEUE_SIZE = 50;

  constructor() {
    // Get or create session ID (safe for privacy modes)
    let sid = '';
    try {
      sid = sessionStorage.getItem('metrics_session_id') || '';
    } catch {
      // sessionStorage can be null in private browsing or SSR
    }
    if (!sid) {
      try {
        sid = typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      } catch {
        sid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }
      try { 
        sessionStorage.setItem('metrics_session_id', sid); 
      } catch {
        // sessionStorage can be null in private browsing or SSR
      }
    }
    this.sessionId = sid;

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush(true));
    }
  }

  track(eventName: string, properties?: MetricPayload) {
    // Check for Do Not Track
    if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') {
      return;
    }

    const event: MetricsEvent = {
      name: eventName,
      route: window.location.pathname,
      referrer: document.referrer || undefined,
      device: this.getDeviceType(),
      lang: navigator.language,
      payload: properties,
      ts: Date.now(),
      sessionId: this.sessionId,
    };

    // Extract UTM parameters
    const params = new URLSearchParams(window.location.search);
    const utm: UtmParams = {};
    const utmKeys: (keyof UtmParams)[] = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    
    utmKeys.forEach(key => {
      const value = params.get(key);
      if (value) {
        utm[key] = value;
      }
    });

    if (Object.keys(utm).length > 0) {
      event.utm = utm;
    }

    this.queue.push(event);

    // Auto-flush if queue is full
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  private scheduleFlush() {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    this.flushTimeout = window.setTimeout(() => this.flush(), this.FLUSH_INTERVAL);
  }

  private async flush(sync = false) {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    try {
      const payload = JSON.stringify({ events });
      const url = '/api/telemetry/log';

      if (sync && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        // Use sendBeacon for synchronous requests (on page unload)
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        // Regular async request
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        });
        console.log(`[Metrics] Tracked ${events.length} events`);
      }
    } catch (error) {
      console.error('[Metrics] Failed to track events:', error);
      // Re-queue failed events if not unloading
      if (!sync) {
        this.queue = [...events, ...this.queue];
      }
    }
  }

  private getDeviceType(): string {
    if(typeof navigator === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  // Track page view
  pageView() {
    this.track('page_view');
  }

  // Track CTA clicks
  ctaClick(button: string, location: string) {
    this.track('cta_click', { button, location });
  }

  // Track booking funnel
  bookStart() {
    this.track('book_start');
  }

  bookComplete() {
    this.track('book_complete');
  }

  // Track quiz
  quizComplete(score: number) {
    this.track('quiz_complete', { score });
  }

  // Track blog engagement
  blogRead(slug: string, category: string) {
    this.track('blog_read', { slug, category });
  }
}

// Export singleton instance
let metricsTrackerInstance: MetricsTracker | null = null;
if (typeof window !== 'undefined') {
  metricsTrackerInstance = new MetricsTracker();
}
export const metricsTracker = metricsTrackerInstance;


// Auto-track page views on route changes
if (typeof window !== 'undefined' && metricsTracker) {
  // Track initial page view
  metricsTracker.pageView();

  // Track subsequent page views (for SPA navigation)
  let lastPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      metricsTracker.pageView();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
