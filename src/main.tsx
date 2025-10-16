import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/tokens.css";
import "./styles/primitives.css";
import "./index.css";
import "./styles/admin.css";
import { isChinaBuild } from './lib/region';
import { initAnalytics } from './lib/initAnalytics';
import { initSessionTracking } from './analytics/events';
import { metricsTracker } from './lib/metricsTracker';
import { injectAnalytics } from './lib/loaders';
import { registerSW } from './pwa/registerSW';
import { bootAnimOnLoad } from './anim/boot';
import { normalizeEntryUrl } from './nav/deeplink';
import './components/ui/HomeClickAnimation'; // Pre-load animation

// Register service worker for PWA
registerSW();

// Initialize global animation system
bootAnimOnLoad();

// Normalize entry URL with lang and ref/utm parameters
normalizeEntryUrl();

// Initialize version guard for automatic cache invalidation
import { bootVersionGuard } from './lib/versionGuard';
bootVersionGuard({ pollMs: 60000 }); // Check every 60 seconds

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

const root = document.getElementById("root")!;
createRoot(root).render(<App />);
