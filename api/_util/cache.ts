const KV = globalThis as any;
if (!KV.__aiCache) KV.__aiCache = new Map();

export function getCache(key: string, ttlSeconds: number): any | null {
  const entry = KV.__aiCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.t > ttlSeconds * 1000) {
    KV.__aiCache.delete(key);
    return null;
  }
  return entry.v;
}

export function setCache(key: string, value: any) {
  KV.__aiCache.set(key, { t: Date.now(), v: value });
}

export function clearCache() {
  KV.__aiCache.clear();
}
