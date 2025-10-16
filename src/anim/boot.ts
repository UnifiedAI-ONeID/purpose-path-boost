import { triggerHomeAnim } from './animator';

/** Run on fresh load or hard refresh */
function isHardLoad(): boolean {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (!nav) return true;
    return nav.type === 'reload' || nav.type === 'navigate';
  } catch { 
    return true; 
  }
}

export function bootAnimOnLoad() {
  if (typeof window === 'undefined') return;
  window.addEventListener('pageshow', (e: PageTransitionEvent) => {
    // pageshow fires for BFCache too; still run the branding moment
    if (isHardLoad()) triggerHomeAnim(900);
  }, { once: true });
}
