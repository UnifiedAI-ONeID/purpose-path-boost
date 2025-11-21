/**
 * Referral tracking utilities
 * Handles ref_code tracking for conversions and clicks
 */

import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';

export async function trackReferral(ref_code: string, type: 'click' | 'conversion' = 'click') {
  if (!ref_code) return;
  
  try {
    await supabase.functions.invoke('api-referral-track', {
      body: { ref_code, type }
    });
  } catch (e) {
    console.error('Failed to track referral:', e);
  }
}

/**
 * Get referral code from URL or storage
 */
export function getReferralCode(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const urlRef = params.get('ref');
    
    if (urlRef) {
      // Store for later use
      sessionStorage.setItem('persist_ref', urlRef);
      return urlRef;
    }
    
    // Check stored ref
    return sessionStorage.getItem('persist_ref');
  } catch {
    return null;
  }
}

/**
 * Track referral click on page load
 */
export function initReferralTracking() {
  const ref = getReferralCode();
  if (ref) {
    trackReferral(ref, 'click');
  }
}
