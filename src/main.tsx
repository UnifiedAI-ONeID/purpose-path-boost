import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { isChinaBuild } from './lib/region';
import { initAnalytics } from './lib/initAnalytics';
import { initSessionTracking } from './analytics/events';

// Initialize analytics based on region
if (!isChinaBuild()) {
  // Global build: Use Umami + PostHog
  initAnalytics();
  initSessionTracking();
} else {
  // China build: Baidu Tongji is loaded via script in index.html
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
