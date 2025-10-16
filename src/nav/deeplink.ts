/**
 * Normalize entry URL to ensure lang parameter is present
 * and persist ref/utm parameters for future navigations
 */
export function normalizeEntryUrl() {
  try {
    const u = new URL(location.href);
    const lang = u.searchParams.get('lang') || localStorage.getItem('zg.lang') || 'en';
    
    if (!u.searchParams.get('lang')) {
      u.searchParams.set('lang', lang);
      history.replaceState({}, '', u.pathname + u.search + u.hash);
    }
    
    // Persist ref/utm for future navigations
    ['ref', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(k => {
      const v = u.searchParams.get(k);
      if (v) {
        sessionStorage.setItem(`persist_${k}`, v);
        
        // Track referral clicks
        if (k === 'ref') {
          // Lazy load and track referral
          import('../lib/referral').then(({ trackReferral }) => {
            trackReferral(v, 'click');
          }).catch(() => {});
        }
      }
    });
  } catch (e) {
    // Silently fail on URL parsing errors
  }
}
