
import posthog from 'posthog-js';
import { functions } from '@/firebase/config';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';

const getPublicConfig = httpsCallable(functions, 'getPublicConfig');
const CONFIG_CACHE_KEY = 'zg.pwa.config';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

interface PublicConfig {
  VITE_UMAMI_ID?: string;
  POSTHOG_KEY?: string;
  [key: string]: string | undefined;
}

async function fetchPublicConfig(): Promise<PublicConfig> {
  const cachedItem = sessionStorage.getItem(CONFIG_CACHE_KEY);
  if (cachedItem) {
    const { timestamp, config } = JSON.parse(cachedItem);
    if (Date.now() - timestamp < CACHE_TTL) {
      console.log('[Analytics] Using cached public config');
      return config;
    }
  }

  console.log('[Analytics] Fetching public config...');
  try {
    const result: HttpsCallableResult<{ config: PublicConfig }> = await getPublicConfig();
    const config = result.data.config;

    sessionStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), config }));

    return config;
  } catch (error) {
    console.error('[Analytics] Failed to fetch public config:', error);
    return {};
  }
}

export const initAnalytics = async () => {
  const config = await fetchPublicConfig();

  // Initialize PostHog
  const posthogKey = config.POSTHOG_KEY;
  if (posthogKey) {
    try {
      posthog.init(posthogKey, {
        api_host: 'https://app.posthog.com',
        capture_pageview: true,
        capture_pageleave: true,
      });
      (window as any).posthog = posthog;
      console.log('[Analytics] PostHog initialized with fetched key');
    } catch (e) {
      console.error('[Analytics] Error initializing PostHog', e);
    }
  } else {
    console.log('[Analytics] PostHog disabled (no key fetched)');
  }

  // Dynamically inject Umami script if ID is available
  const umamiId = config.VITE_UMAMI_ID;
  if (umamiId && !document.querySelector('#umami-script')) {
    const script = document.createElement('script');
    script.id = 'umami-script';
    script.async = true;
    script.src = 'https://analytics.eu.umami.is/script.js';
    script.setAttribute('data-website-id', umamiId);
    document.head.appendChild(script);
    console.log('[Analytics] Umami script injected with fetched ID');
  } else if ((window as any).umami) {
    console.log('[Analytics] Umami already initialized.');
  } else {
    console.log('[Analytics] Umami disabled (no ID fetched)');
  }
};
