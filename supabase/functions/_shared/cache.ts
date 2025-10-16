/**
 * In-memory cache utilities for Edge Functions
 * Uses globalThis to persist across function invocations
 */

interface CacheEntry {
  t: number; // timestamp
  v: any;    // value
}

const KV = globalThis as any;
if (!KV.__edgeFunctionCache) KV.__edgeFunctionCache = new Map<string, CacheEntry>();

/**
 * Get cached value if not expired
 */
export function getCache(key: string, ttlSeconds: number): any | null {
  const entry = KV.__edgeFunctionCache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.t > ttlSeconds * 1000) {
    KV.__edgeFunctionCache.delete(key);
    return null;
  }
  
  return entry.v;
}

/**
 * Set cache value with current timestamp
 */
export function setCache(key: string, value: any): void {
  KV.__edgeFunctionCache.set(key, { t: Date.now(), v: value });
}

/**
 * Clear entire cache
 */
export function clearCache(): void {
  KV.__edgeFunctionCache.clear();
}

/**
 * Clear specific cache key
 */
export function clearCacheKey(key: string): void {
  KV.__edgeFunctionCache.delete(key);
}

/**
 * Get cache size
 */
export function getCacheSize(): number {
  return KV.__edgeFunctionCache.size;
}
