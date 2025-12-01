import posthog from 'posthog-js';
import { functions } from '@/firebase/config';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';

// --- Constants and Type Definitions ---

const CONFIG_CACHE_KEY = 'zg.pwa.config';
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
const CACHE_STALE_TTL_MS = 1000 * 60 * 5; // 5 minutes (for stale-while-revalidate)

interface PublicConfig {
  VITE_UMAMI_ID?: string;
  POSTHOG_KEY?: string;
  [key: string]: string | undefined;
}

interface CachedConfig {
  timestamp: number;
  config: PublicConfig;
}

// --- Configuration Fetching ---

const getPublicConfig = httpsCallable(functions, 'getPublicConfig');

async function fetchAndCacheConfig(): Promise<PublicConfig> {
  console.log('[Analytics] Fetching remote public config...');
  try {
    const result: HttpsCallableResult<{ config: PublicConfig }> = await getPublicConfig();
    const config = result.data.config;

    const cacheData: CachedConfig = {
      timestamp: Date.now(),
      config,
    };
    sessionStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(cacheData));
    console.log('[Analytics] Public config cached.');
    return config;
  } catch (error) {
    console.error('[Analytics] Failed to fetch public config:', error);
    return {};
  }
}

async function getCachedConfig(): Promise<PublicConfig | null> {
  const cachedItem = sessionStorage.getItem(CONFIG_CACHE_KEY);
  if (!cachedItem) return null;

  try {
    const { timestamp, config } = JSON.parse(cachedItem) as CachedConfig;
    const now = Date.now();

    if (now - timestamp < CACHE_TTL_MS) {
      console.log('[Analytics] Using fresh cached public config.');
      // Stale-while-revalidate: if cache is older than STALE_TTL, refetch in background
      if (now - timestamp > CACHE_STALE_TTL_MS) {
        console.log('[Analytics] Cache is stale, revalidating in background...');
        fetchAndCacheConfig(); // No need to await
      }
      return config;
    }

    console.log('[Analytics] Cached config expired.');
    return null;
  } catch (e) {
    console.error('[Analytics] Failed to parse cached config:', e);
    return null;
  }
}

async function resolvePublicConfig(): Promise<PublicConfig> {
  const cachedConfig = await getCachedConfig();
  if (cachedConfig) {
    return cachedConfig;
  }
  return await fetchAndCacheConfig();
}

// --- Service Initializers ---

function initPostHog(posthogKey: string): void {
  if ((window as any).posthog) {
    console.log('[Analytics] PostHog already initialized.');
    return;
  }
  try {
    posthog.init(posthogKey, {
      api_host: 'https://app.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
    });
    (window as any).posthog = posthog;
    console.log('[Analytics] PostHog initialized.');
  } catch (e) {
    console.error('[Analytics] Error initializing PostHog:', e);
  }
}

function initUmami(umamiId: string): void {
  if (document.querySelector('#umami-script') || (window as any).umami) {
    console.log('[Analytics] Umami already initialized.');
    return;
  }
  const script = document.createElement('script');
  script.id = 'umami-script';
  script.async = true;
  script.src = 'https://analytics.eu.umami.is/script.js';
  script.setAttribute('data-website-id', umamiId);
  document.head.appendChild(script);
  console.log('[Analytics] Umami script injected.');
}

// --- Main Initialization Function ---

/**
 * Initializes analytics services (PostHog, Umami) by fetching remote configuration.
 * It uses a cache with stale-while-revalidate logic to ensure fast startups.
 */
export const initAnalytics = async (): Promise<void> => {
  const config = await resolvePublicConfig();

  if (config.POSTHOG_KEY) {
    initPostHog(config.POSTHOG_KEY);
  } else {
    console.log('[Analytics] PostHog key not found in config.');
  }

  if (config.VITE_UMAMI_ID) {
    initUmami(config.VITE_UMAMI_ID);
  } else {
    console.log('[Analytics] Umami ID not found in config.');
  }
};
