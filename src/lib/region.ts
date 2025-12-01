/**
 * @file This file is responsible for detecting the application's region (Global vs. China)
 * and providing region-specific configurations. It uses environment variables set at build time
 * to determine the current region.
 */

// --- Type Definitions ---

export type Region = 'global' | 'china';

export interface CdnConfig {
  react: string;
  reactDom: string;
}

export interface RegionConfig {
  analytics: ('umami' | 'posthog' | 'baidu-tongji')[];
  booking: 'cal.com' | 'feishu';
  maps: 'google' | 'amap';
  payment: 'airwallex';
  cdn: CdnConfig;
}

// --- Main Configuration Object ---

/**
 * A comprehensive configuration object that holds settings for each supported region.
 * This makes it easy to manage and compare configurations.
 */
const regionConfig: Record<Region, RegionConfig> = {
  global: {
    analytics: ['umami', 'posthog'],
    booking: 'cal.com',
    maps: 'google',
    payment: 'airwallex',
    cdn: {
      react: 'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
      reactDom: 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
    },
  },
  china: {
    analytics: ['baidu-tongji'],
    booking: 'feishu',
    maps: 'amap',
    payment: 'airwallex', // Airwallex supports WeChat/Alipay, making it suitable for both regions.
    cdn: {
      react: 'https://cdn.bootcdn.net/ajax/libs/react/18.3.1/umd/react.production.min.js',
      reactDom: 'https://cdn.bootcdn.net/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js',
    },
  },
} as const;

// --- Helper Functions ---

/**
 * Determines the current application region based on the `VITE_REGION` environment variable.
 * This variable should be set during the build process (e.g., `npm run build:china`).
 *
 * @returns {Region} The detected region, defaulting to 'global'.
 */
export function getRegion(): Region {
  const envRegion = import.meta.env.VITE_REGION as Region | undefined;
  
  if (envRegion && ['global', 'china'].includes(envRegion)) {
    return envRegion;
  }
  
  console.warn(`[Region] VITE_REGION is not set or invalid. Defaulting to 'global'.`);
  return 'global';
}

/**
 * A convenience function to quickly check if the current build is for the China region.
 * @returns {boolean} `true` if the region is 'china', otherwise `false`.
 */
export const isChinaBuild = (): boolean => {
  return getRegion() === 'china';
};

/**
 * Dynamically imports the appropriate analytics module based on the detected region.
 * This is a form of code splitting that ensures only the necessary analytics code is loaded.
 *
 * @returns {Promise<any>} A promise that resolves to the analytics module.
 */
export const getAnalyticsModule = (): Promise<any> => {
  if (isChinaBuild()) {
    return import('@/lib/analytics-cn');
  }
  // Assuming a global analytics events module exists.
  return import('@/analytics/events');
};

/**
 * Retrieves the full configuration object for the current region.
 *
 * @returns {RegionConfig} The configuration object for the detected region.
 */
export const getCurrentRegionConfig = (): RegionConfig => {
  return regionConfig[getRegion()];
};
