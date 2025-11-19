// PWA Performance Metrics Tracking using Web Vitals

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

// Web Vitals thresholds
const THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
  INP: { good: 200, poor: 500 }    // Interaction to Next Paint
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

function reportMetric(metric: PerformanceMetric) {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log('[PWA Performance]', metric.name, {
      value: `${metric.value.toFixed(2)}ms`,
      rating: metric.rating
    });
  }

  // Send to analytics
  if (typeof window !== 'undefined' && window.umami) {
    window.umami('pwa_performance', {
      metric: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating
    });
  }

  // Store in localStorage for monitoring
  try {
    const key = 'zg.pwa.metrics';
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    stored.push(metric);
    
    // Keep only last 50 metrics
    if (stored.length > 50) stored.shift();
    
    localStorage.setItem(key, JSON.stringify(stored));
  } catch (e) {
    console.warn('[PWA Performance] Failed to store metrics:', e);
  }
}

export function initPerformanceTracking() {
  if (typeof window === 'undefined') return;

  // First Contentful Paint (FCP)
  const paintObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        reportMetric({
          name: 'FCP',
          value: entry.startTime,
          rating: getRating('FCP', entry.startTime),
          timestamp: Date.now()
        });
      }
    }
  });

  try {
    paintObserver.observe({ type: 'paint', buffered: true });
  } catch (e) {
    // Paint timing not supported
  }

  // Largest Contentful Paint (LCP)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as any;
    
    reportMetric({
      name: 'LCP',
      value: lastEntry.renderTime || lastEntry.loadTime,
      rating: getRating('LCP', lastEntry.renderTime || lastEntry.loadTime),
      timestamp: Date.now()
    });
  });

  try {
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    // LCP not supported
  }

  // First Input Delay (FID)
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fidEntry = entry as any;
      reportMetric({
        name: 'FID',
        value: fidEntry.processingStart - fidEntry.startTime,
        rating: getRating('FID', fidEntry.processingStart - fidEntry.startTime),
        timestamp: Date.now()
      });
    }
  });

  try {
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    // FID not supported
  }

  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const clsEntry = entry as any;
      if (!clsEntry.hadRecentInput) {
        clsValue += clsEntry.value;
      }
    }
  });

  try {
    clsObserver.observe({ type: 'layout-shift', buffered: true });
    
    // Report CLS when page visibility changes or unloads
    const reportCLS = () => {
      reportMetric({
        name: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue),
        timestamp: Date.now()
      });
    };
    
    addEventListener('visibilitychange', reportCLS);
    addEventListener('pagehide', reportCLS);
  } catch (e) {
    // CLS not supported
  }

  // Time to First Byte (TTFB)
  if (performance && performance.timing) {
    const ttfb = performance.timing.responseStart - performance.timing.requestStart;
    if (ttfb > 0) {
      reportMetric({
        name: 'TTFB',
        value: ttfb,
        rating: getRating('TTFB', ttfb),
        timestamp: Date.now()
      });
    }
  }

  // Navigation Timing
  if (performance && performance.getEntriesByType) {
    const navEntries = performance.getEntriesByType('navigation') as any[];
    if (navEntries.length > 0) {
      const nav = navEntries[0];
      
      // DOM Content Loaded
      if (nav.domContentLoadedEventEnd) {
        const dcl = nav.domContentLoadedEventEnd - nav.fetchStart;
        reportMetric({
          name: 'DCL',
          value: dcl,
          rating: dcl < 1500 ? 'good' : dcl < 2500 ? 'needs-improvement' : 'poor',
          timestamp: Date.now()
        });
      }
      
      // Load Complete
      if (nav.loadEventEnd) {
        const loadComplete = nav.loadEventEnd - nav.fetchStart;
        reportMetric({
          name: 'Load',
          value: loadComplete,
          rating: loadComplete < 3000 ? 'good' : loadComplete < 5000 ? 'needs-improvement' : 'poor',
          timestamp: Date.now()
        });
      }
    }
  }
}

// Get all stored metrics
export function getStoredMetrics(): PerformanceMetric[] {
  try {
    return JSON.parse(localStorage.getItem('zg.pwa.metrics') || '[]');
  } catch {
    return [];
  }
}

// Clear stored metrics
export function clearStoredMetrics() {
  try {
    localStorage.removeItem('zg.pwa.metrics');
  } catch (e) {
    console.warn('[PWA Performance] Failed to clear metrics:', e);
  }
}
