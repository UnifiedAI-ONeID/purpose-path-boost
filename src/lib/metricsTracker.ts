/**
 * @file This file provides a comprehensive client-side metrics tracking solution.
 * It queues events and sends them in batches to a telemetry endpoint,
 * handling session management, UTM parameter extraction, and graceful degradation
 * in environments where necessary APIs (like sessionStorage or crypto) are not available.
 */

// --- Type Definitions ---

interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

type MetricPayloadValue = string | number | boolean | null;
type MetricPayload = Record<string, MetricPayloadValue>;

interface MetricsEvent {
  name: string;
  route?: string;
  referrer?: string;
  utm?: UtmParams;
  device?: string;
  lang?: string;
  payload?: MetricPayload;
  ts: number; // Changed to mandatory
  sessionId: string; // Changed to mandatory
}

// --- MetricsTracker Class ---

class MetricsTracker {
  private sessionId: string;
  private queue: MetricsEvent[] = [];
  private flushTimeout: number | null = null;
  
  private readonly FLUSH_INTERVAL_MS = 5000; // 5 seconds
  private readonly MAX_QUEUE_SIZE = 50;
  private readonly API_ENDPOINT = '/api/telemetry/log';

  constructor() {
    this.sessionId = this.getSessionId();
    this.addEventListeners();
  }

  /**
   * Tracks a custom event.
   * @param {string} eventName - The name of the event.
   * @param {MetricPayload} [properties] - Additional data associated with the event.
   */
  public track(eventName: string, properties?: MetricPayload): void {
    if (this.isDoNotTrackEnabled()) {
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
      utm: this.getUtmParams(),
    };

    this.queue.push(event);

    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  // --- Private Methods ---

  private getSessionId(): string {
    try {
      let sid = sessionStorage.getItem('metrics_session_id');
      if (!sid) {
        sid = self.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem('metrics_session_id', sid);
      }
      return sid;
    } catch {
      // Fallback for environments where sessionStorage is blocked
      return 'session-storage-unavailable';
    }
  }

  private addEventListeners(): void {
    // Use sendBeacon for more reliable data transmission on page unload
    window.addEventListener('beforeunload', () => this.flush(true));
  }
  
  private isDoNotTrackEnabled(): boolean {
    return navigator.doNotTrack === '1';
  }

  private getUtmParams(): UtmParams | undefined {
    const params = new URLSearchParams(window.location.search);
    const utmKeys: (keyof UtmParams)[] = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    const utm: UtmParams = {};

    utmKeys.forEach(key => {
      const value = params.get(key);
      if (value) {
        utm[key] = value;
      }
    });

    return Object.keys(utm).length > 0 ? utm : undefined;
  }

  private scheduleFlush(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    this.flushTimeout = window.setTimeout(() => this.flush(), this.FLUSH_INTERVAL_MS);
  }

  private async flush(isUnloading = false): Promise<void> {
    if (this.queue.length === 0) return;

    const eventsToFlush = [...this.queue];
    this.queue = [];

    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    const payload = JSON.stringify({ events: eventsToFlush });

    try {
      // Use sendBeacon for unloading, as it's more likely to succeed
      if (isUnloading && navigator.sendBeacon) {
        navigator.sendBeacon(this.API_ENDPOINT, new Blob([payload], { type: 'application/json' }));
      } else {
        await fetch(this.API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: isUnloading, // keepalive helps ensure the request is sent even if the page is unloading
        });
      }
    } catch (error) {
      console.error('[Metrics] Failed to track events:', error);
      // If not unloading, re-queue the events to retry later
      if (!isUnloading) {
        this.queue.unshift(...eventsToFlush);
      }
    }
  }

  private getDeviceType(): 'tablet' | 'mobile' | 'desktop' {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
    return 'desktop';
  }

  // --- Public Tracking Methods for Common Events ---

  public pageView(): void {
    this.track('page_view');
  }

  public ctaClick(button: string, location: string): void {
    this.track('cta_click', { button, location });
  }

  public bookStart(): void {
    this.track('book_start');
  }

  public bookComplete(): void {
    this.track('book_complete');
  }
}

// --- Singleton Instantiation and Export ---

let metricsTrackerInstance: MetricsTracker | null = null;

// Ensure this only runs in a browser environment
if (typeof window !== 'undefined') {
  metricsTrackerInstance = new MetricsTracker();

  // Auto-track initial page view
  metricsTrackerInstance.pageView();

  // Auto-track subsequent page views for SPAs
  let lastPath = window.location.pathname;
  new MutationObserver(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      metricsTrackerInstance?.pageView();
    }
  }).observe(document.body, { childList: true, subtree: true });
}

export const metricsTracker = metricsTrackerInstance;
