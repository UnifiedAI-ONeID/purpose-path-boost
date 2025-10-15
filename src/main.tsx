import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { isChinaBuild } from './lib/region';
import { initAnalytics } from './lib/initAnalytics';
import { initSessionTracking } from './analytics/events';
import { metricsTracker } from './lib/metricsTracker';
import { injectAnalytics } from './lib/loaders';

// Initialize analytics based on region
if (!isChinaBuild()) {
  // Global build: Use Umami + PostHog + Metrics Tracker
  initAnalytics();
  initSessionTracking();
  
  // Metrics tracker is automatically initialized on import
  // Track CTA clicks throughout the app
  console.log('[Metrics] Tracker initialized');
} else {
  // China build: Inject Baidu Tongji
  injectAnalytics();
  
  // Session tracking for China analytics
  if (typeof window !== 'undefined') {
    let sessionStartTime = Date.now();
    
    window.addEventListener('beforeunload', () => {
      const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
      if (window._hmt) {
        window._hmt.push(['_trackEvent', 'engagement', 'session_duration', `${duration}s`, duration]);
      }
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
