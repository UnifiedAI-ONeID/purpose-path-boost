/**
 * Region detection and configuration
 * Determines whether to use global or China-specific integrations
 */

export type Region = 'global' | 'china';

/**
 * Get current build region from environment
 * Set VITE_REGION in build scripts:
 * - npm run build:global → VITE_REGION=global
 * - npm run build:china → VITE_REGION=china
 */
export const getRegion = (): Region => {
  const envRegion = import.meta.env.VITE_REGION as Region | undefined;
  return envRegion || 'global';
};

/**
 * Check if current build is for China
 */
export const isChinaBuild = (): boolean => {
  return getRegion() === 'china';
};

/**
 * Get analytics implementation based on region
 */
export const getAnalytics = () => {
  if (isChinaBuild()) {
    return import('@/lib/analytics-cn');
  }
  return import('@/analytics/events');
};

/**
 * Region-specific configuration
 */
export const regionConfig = {
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
    payment: 'airwallex', // Still use Airwallex (supports WeChat/Alipay)
    cdn: {
      react: 'https://cdn.bootcdn.net/ajax/libs/react/18.3.1/umd/react.production.min.js',
      reactDom: 'https://cdn.bootcdn.net/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js',
    },
  },
} as const;

/**
 * Get current region config
 */
export const getCurrentConfig = () => {
  return regionConfig[getRegion()];
};
