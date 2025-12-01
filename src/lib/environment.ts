/**
 * @file Centralizes environment-specific logic and feature flags.
 * This module determines the application's runtime environment (e.g., China vs. Global)
 * and exports corresponding endpoints and feature flags.
 */

// --- Type Definitions ---

export type AnalyticsProvider = 'baidu-tongji' | 'umami' | 'disabled';
export type BookingProvider = 'feishu' | 'cal' | 'disabled';
export type MapsProvider = 'amap' | 'google' | 'disabled';

export interface Endpoints {
  analytics: AnalyticsProvider;
  booking: BookingProvider;
  maps: MapsProvider;
}

export interface AppEnvironment {
  /** Is the application running in the China region? */
  isCN: boolean;
  /** A collection of environment-specific service endpoints. */
  endpoints: Endpoints;
}

// --- Environment Detection ---

/**
 * Safely retrieves the window.location.hostname.
 * Returns an empty string if window is not available (e.g., in SSR).
 */
const getHostname = (): string => {
  return typeof window !== 'undefined' ? window.location.hostname : '';
};

/**
 * Safely retrieves the country code injected by a CDN (e.g., Vercel Edge).
 * `__EDGE_COUNTRY__` is a common convention.
 */
const getEdgeCountry = (): string | undefined => {
  return typeof window !== 'undefined' && (window as any).__EDGE_COUNTRY__
    ? (window as any).__EDGE_COUNTRY__
    : undefined;
};

/**
 * Determines if the application is running in the China (CN) region.
 * The logic prioritizes the Edge Country for accuracy and falls back to hostname checks.
 */
const detectCNEnvironment = (): boolean => {
  const hostname = getHostname();
  const edgeCountry = getEdgeCountry();

  if (edgeCountry) {
    return edgeCountry.toUpperCase() === 'CN';
  }

  // Fallback to hostname check if edge country is not available
  return hostname.endsWith('.cn') || hostname.includes('.cn.');
};

/**
 * Configures service endpoints based on the detected environment.
 * @param isCN - Whether the environment is determined to be in China.
 */
const getEndpoints = (isCN: boolean): Endpoints => {
  return {
    analytics: isCN ? 'baidu-tongji' : 'umami',
    booking: isCN ? 'feishu' : 'cal',
    maps: isCN ? 'amap' : 'google',
  };
};

// --- Main Export ---

const isCN = detectCNEnvironment();

/**
 * The main environment configuration object for the application.
 * It includes a boolean flag for the CN environment and a set of endpoints.
 */
export const environment: AppEnvironment = {
  isCN,
  endpoints: getEndpoints(isCN),
};
