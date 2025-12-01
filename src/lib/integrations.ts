/**
 * @file Manages fetching and caching of public integration data from the API.
 */

import { invokeApi } from './api-client';

// --- Type Definitions ---

/**
 * Represents a single integration available in the system.
 * This is a flexible type; you can add more specific properties as needed.
 */
export interface Integration {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  // Allow any other properties
  [key: string]: any;
}

/**
 * Defines the structure of the cached data, including a timestamp for TTL.
 */
interface CachedIntegrations {
  timestamp: number;
  integrations: Integration[];
}

// --- Module State ---

/**
 * In-memory cache for the integrations data.
 * Using a simple module-level variable is effective for SPA-like behavior.
 * @type {CachedIntegrations | null}
 */
let cache: CachedIntegrations | null = null;

/**
 * Time-to-live for the cache in milliseconds.
 * After this duration, the data will be fetched again from the API.
 * @type {number} (5 minutes)
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

// --- Public Functions ---

/**
 * Fetches the list of public integrations, utilizing an in-memory cache to avoid redundant API calls.
 *
 * @returns {Promise<Integration[]>} A promise that resolves to an array of Integration objects.
 *          Returns an empty array if the API call fails.
 */
export async function getIntegrations(): Promise<Integration[]> {
  const now = Date.now();

  // Check if a valid, non-expired cache exists
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    console.log('[Integrations] Returning cached data.');
    return cache.integrations;
  }

  console.log('[Integrations] Cache is empty or expired. Fetching from API...');
  try {
    // Assuming invokeApi returns a response object with a `data` property
    // containing the array of integrations.
    const response = await invokeApi<{ data: Integration[] }>('/api/integrations/public');

    // Ensure the response has the expected structure
    const integrations = response?.data || [];
    
    // Update the cache
    cache = {
      timestamp: now,
      integrations: integrations,
    };

    console.log(`[Integrations] Fetched and cached ${integrations.length} integrations.`);
    return integrations;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[Integrations] Failed to fetch or process integration data:', errorMessage);
    
    // In case of an error, clear the potentially stale cache
    cache = null;

    // Return an empty array to prevent consumers from breaking
    return [];
  }
}

/**
 * Manually clears the in-memory cache for integrations.
 * This can be useful for debugging or when a user action (like logout/login)
 * might invalidate the data.
 */
export function clearIntegrationsCache(): void {
  console.log('[Integrations] Cache cleared.');
  cache = null;
}
