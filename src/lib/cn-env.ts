/**
 * @file China environment detection utility.
 * This module exports a simple boolean flag indicating whether the app
 * is running in the China (CN) region.
 * 
 * Re-exports the isCN detection from environment.ts for backward compatibility.
 */

import { environment } from './environment';

/**
 * Whether the application is running in the China (CN) region.
 * This is determined by checking Edge country headers or hostname patterns.
 */
export const isCN: boolean = environment.isCN;

/**
 * Get the current region as a string.
 * @returns 'china' if in CN region, 'global' otherwise
 */
export const getRegion = (): 'china' | 'global' => {
  return isCN ? 'china' : 'global';
};

/**
 * Check if a feature should be enabled for the current region.
 * @param globalEnabled - Whether the feature is enabled globally
 * @param cnEnabled - Whether the feature is enabled in China (defaults to globalEnabled)
 */
export const isFeatureEnabled = (globalEnabled: boolean, cnEnabled?: boolean): boolean => {
  return isCN ? (cnEnabled ?? globalEnabled) : globalEnabled;
};
