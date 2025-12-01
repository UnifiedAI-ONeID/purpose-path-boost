/**
 * @file This file provides a utility for creating UTM-tagged URLs, which are essential for campaign tracking in web analytics.
 */

// --- Type Definitions ---

export type SocialPlatform =
  | 'linkedin' | 'facebook' | 'instagram' | 'x' | 'youtube'
  | 'wechat' | 'red' | 'zhihu' | 'douyin' | 'other';

export interface UTMParams {
  utm_source: SocialPlatform | string;
  utm_medium: 'social' | 'cpc' | 'email' | 'referral' | 'organic' | string;
  utm_campaign: string;
  utm_content?: string;
  utm_term?: string;
}

// --- Core Function ---

/**
 * Appends UTM tracking parameters to a given URL.
 *
 * This function creates a robust, trackable URL for marketing campaigns, ensuring that
 * traffic sources can be accurately identified in analytics platforms like Google Analytics.
 *
 * @param {string} baseUrl - The base URL to which the UTM parameters will be appended.
 * @param {UTMParams} params - An object containing the core UTM parameters.
 * @param {Record<string, string>} [extraParams={}] - An optional record of additional query parameters to add to the URL.
 * @returns {string} The new URL complete with UTM and any extra parameters.
 * @throws {Error} If the provided `baseUrl` is invalid.
 */
export function utmize(
  baseUrl: string,
  params: UTMParams,
  extraParams: Record<string, string> = {}
): string {
  try {
    // Using `location.origin` as a base ensures that relative URLs are handled correctly.
    const url = new URL(baseUrl, location.origin);

    // Append all UTM parameters from the params object.
    for (const [key, value] of Object.entries(params)) {
      if (value) { // Only add the parameter if it has a value.
        url.searchParams.set(key, value);
      }
    }

    // Append any extra, non-UTM parameters.
    for (const [key, value] of Object.entries(extraParams)) {
      url.searchParams.set(key, value);
    }

    return url.toString();
  } catch (error) {
    // This will catch errors from an invalid `baseUrl`, such as "http://".
    if (error instanceof TypeError) {
      throw new Error(`Invalid baseUrl provided to utmize function: "${baseUrl}"`);
    }
    // Re-throw other unexpected errors.
    throw error;
  }
}

// --- Convenience Factory for Social Media ---

/**
 * A specialized factory function for creating UTM-tagged URLs for social media posts.
 *
 * @param {string} url - The base URL to be shared.
 * @param {SocialPlatform} platform - The social media platform where the link will be shared.
 * @param {string} campaignName - A descriptive name for the campaign (e.g., 'summer-sale-2024').
 * @returns {string} The UTM-tagged URL.
 */
export function createSocialUTMLink(url: string, platform: SocialPlatform, campaignName: string): string {
  const params: UTMParams = {
    utm_source: platform,
    utm_medium: 'social',
    utm_campaign: campaignName,
    // Content can be used to differentiate links within the same campaign, e.g., 'post-vs-story'.
    utm_content: `post-${new Date().toISOString().slice(0, 10)}`,
  };
  return utmize(url, params);
}
