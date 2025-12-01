/**
 * @file This file contains utilities for tracking referrals.
 * It handles extracting referral codes from URLs, storing them in sessionStorage,
 * and sending tracking events to the backend.
 */

// --- Constants ---

const API_ENDPOINT = '/api/referral/track';
const SESSION_STORAGE_KEY = 'persist_ref';
const URL_QUERY_PARAM = 'ref';

// --- Type Definitions ---

type ReferralType = 'click' | 'conversion';

// --- Core Functions ---

/**
 * Tracks a referral event by sending a request to the backend.
 * This function is designed as a "fire-and-forget" call. It uses `navigator.sendBeacon`
 * for reliability, especially when the page is being unloaded.
 *
 * @param {string} refCode - The referral code to track.
 * @param {ReferralType} [type='click'] - The type of referral event.
 */
export async function trackReferral(refCode: string, type: ReferralType = 'click'): Promise<void> {
  if (!refCode) return;

  const payload = JSON.stringify({ ref_code: refCode, type });

  try {
    // `sendBeacon` is ideal for analytics as it's non-blocking and works even during page unload.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(API_ENDPOINT, new Blob([payload], { type: 'application/json' }));
    } else {
      // Fallback to fetch for older browsers.
      await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true, // Important for requests that might outlive the page
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[Referral] Failed to track referral for code "${refCode}":`, errorMessage);
  }
}

/**
 * Retrieves the referral code from the URL query parameters or sessionStorage.
 * If a referral code is found in the URL, it is persisted to sessionStorage for the session.
 *
 * @returns {string | null} The referral code if found, otherwise null.
 */
export function getReferralCode(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const urlRef = params.get(URL_QUERY_PARAM);

    if (urlRef) {
      // Persist the referral code from the URL for the current session.
      sessionStorage.setItem(SESSION_STORAGE_KEY, urlRef);
      return urlRef;
    }

    // If no code in URL, check if one was previously stored in the session.
    return sessionStorage.getItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error('[Referral] Could not access sessionStorage. Referral tracking might be impaired.', error);
    return null; // Return null if sessionStorage is not accessible (e.g., in private browsing).
  }
}

/**
 * Initializes referral tracking on page load.
 * It checks for a referral code and, if found, tracks an initial 'click' event.
 */
export function initReferralTracking(): void {
  const refCode = getReferralCode();
  if (refCode) {
    trackReferral(refCode, 'click');
  }
}
