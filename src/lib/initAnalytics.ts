import posthog from 'posthog-js';

export const initAnalytics = () => {
  // Initialize PostHog if key is provided
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
  
  if (posthogKey && posthogKey !== 'phc_xxxxx') {
    posthog.init(posthogKey, {
      api_host: 'https://app.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
    });
    
    window.posthog = posthog;
    
    if (import.meta.env.DEV) {
      console.log('[Analytics] PostHog initialized');
    }
  } else if (import.meta.env.DEV) {
    console.log('[Analytics] PostHog disabled (no API key)');
  }

  // Umami is initialized via script tag in index.html
  // Check if Umami is available
  if (window.umami && import.meta.env.DEV) {
    console.log('[Analytics] Umami detected');
  }
};
