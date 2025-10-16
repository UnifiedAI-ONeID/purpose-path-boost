/**
 * Normalize entry URL to persist ref/utm parameters for future navigations
 * Language preference is managed via localStorage/cookies (no URL param needed)
 */
export function normalizeEntryUrl() {
  try {
    const u = new URL(location.href);
    
    // If lang param exists in URL, save to localStorage (for shared URLs)
    const langParam = u.searchParams.get('lang');
    if (langParam && ['en', 'zh-CN', 'zh-TW'].includes(langParam)) {
      localStorage.setItem('zg.lang', langParam);
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
