/**
 * Device detection utilities
 * Detects mobile devices based on user agent and screen size
 */

declare global {
  interface Window {
    opera?: any;
  }
  interface Navigator {
    standalone?: boolean;
  }
}

export function isMobileDevice(): boolean {
  // Check user agent first (more reliable than screen size)
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Mobile device patterns
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isUserAgentMobile = mobileRegex.test(userAgent);
  
  // Check screen size as secondary indicator
  const isScreenMobile = window.innerWidth < 768;
  
  // Also check touch capability
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Consider it mobile if user agent OR (small screen AND touch)
  return isUserAgentMobile || (isScreenMobile && isTouchDevice);
}

export function isTabletDevice(): boolean {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const tabletRegex = /iPad|Android.*tablet|tablet.*Android|SM-T|GT-P|SCH-I800|SHW-M380|Kindle|PlayBook|Nexus 7|Nexus 10/i;
  
  return tabletRegex.test(userAgent);
}

export function isDesktopDevice(): boolean {
  return !isMobileDevice() && !isTabletDevice();
}

/**
 * Get device type as string
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (isMobileDevice()) return 'mobile';
  if (isTabletDevice()) return 'tablet';
  return 'desktop';
}

/**
 * Check if app is running as PWA (installed)
 */
export function isPWA(): boolean {
  // Check if running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = navigator.standalone === true;
  
  return isStandalone || isIOSStandalone;
}
