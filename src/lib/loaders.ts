/**
 * @file Responsible for dynamically injecting scripts and providing environment-specific URLs.
 * This module uses the centralized environment configuration to decide which scripts to load
 * and which URLs to use for services like analytics and booking.
 */

import { environment } from './environment';

// --- Constants ---

// It's good practice to keep environment variable keys in one place.
const VITE_BAIDU_TONGJI_ID = import.meta.env.VITE_BAIDU_TONGJI_ID as string;
const VITE_FEISHU_FORM_ID = import.meta.env.VITE_FEISHU_FORM_ID as string;
const CAL_DISCOVERY_URL = 'https://cal.com/zhengrowth/discovery';
const BAIDU_SCRIPT_ID = 'baidu-analytics-script';

// --- Script Injection ---

/**
 * Dynamically injects the Baidu Tongji analytics script if the environment is configured for it.
 * It ensures the script is only injected once.
 */
function injectBaiduAnalyticsScript(): void {
  if (!VITE_BAIDU_TONGJI_ID) {
    console.warn('[Loaders] Baidu Tongji script cannot be injected: VITE_BAIDU_TONGJI_ID is not set.');
    return;
  }

  if (document.getElementById(BAIDU_SCRIPT_ID)) {
    console.log('[Loaders] Baidu Tongji script already present.');
    return;
  }

  const script = document.createElement('script');
  script.id = BAIDU_SCRIPT_ID;
  script.src = `https://hm.baidu.com/hm.js?${VITE_BAIDU_TONGJI_ID}`;
  script.async = true;
  document.head.appendChild(script);
  console.log('[Loaders] Baidu Tongji script injected.');
}

/**
 * Main function to inject all necessary third-party scripts based on the environment.
 * Currently, it only handles Baidu analytics. Umami is assumed to be loaded via the main HTML file.
 */
export function injectAnalytics(): void {
  if (environment.endpoints.analytics === 'baidu-tongji') {
    injectBaiduAnalyticsScript();
  }
}

// --- Dynamic URLs ---

/**
 * Returns the appropriate booking URL based on the current environment.
 * It will use the Feishu form URL in a CN environment and the Cal.com URL otherwise.
 *
 * @returns {string} The URL for the booking provider's page.
 * @throws {Error} If the required environment variable for a provider is not set.
 */
export function getBookingSrc(): string {
  switch (environment.endpoints.booking) {
    case 'feishu':
      if (!VITE_FEISHU_FORM_ID) {
        throw new Error('Feishu booking is enabled, but VITE_FEISHU_FORM_ID is not set.');
      }
      return `https://p3-feishu-sign.feishu.cn/share/base/form/${VITE_FEISHU_FORM_ID}?from=cn`;
    
    case 'cal':
      return CAL_DISCOVERY_URL;

    case 'disabled':
      console.warn('[Loaders] Booking is disabled in the current environment configuration.');
      return '#booking-disabled';
      
    default:
      console.warn(`[Loaders] Unknown booking provider: ${environment.endpoints.booking}. Defaulting to Cal.com.`);
      return CAL_DISCOVERY_URL;
  }
}
