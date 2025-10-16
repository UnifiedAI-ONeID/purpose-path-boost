import { createRoot } from "react-dom/client";
import { EarlyApply } from './prefs/early-apply';
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
root.insertAdjacentHTML('afterbegin', '<script>(function(){try{var d=document.documentElement;var s=localStorage.getItem("zg.theme");var m=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;var t=s||"auto";var r=t==="dark"?"dark":t==="light"?"light":(m?"dark":"light");d.setAttribute("data-theme",r);if(r==="dark")d.classList.add("dark");var meta=document.querySelector(\'meta[name="theme-color"]\')||(function(){var x=document.createElement("meta");x.name="theme-color";document.head.appendChild(x);return x})();meta.setAttribute("content",r==="dark"?"#0b1f1f":"#ffffff");var q=new URLSearchParams(location.search).get("lang");var sl=localStorage.getItem("zg.lang");var nl=(navigator.language||"en").toLowerCase();var al=nl.startsWith("zh-tw")||nl.startsWith("zh-hk")?"zh-TW":(nl.startsWith("zh")?"zh-CN":"en");var L=(q||sl||al);d.setAttribute("lang",L);if(q)localStorage.setItem("zg.lang",L)}catch(e){}})()</script>');
createRoot(root).render(<App />);
