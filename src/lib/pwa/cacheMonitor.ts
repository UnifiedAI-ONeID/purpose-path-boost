// Service Worker Cache Size Monitoring and Management

interface CacheStats {
  name: string;
  size: number; // in bytes
  entryCount: number;
}

interface CacheReport {
  totalSize: number;
  caches: CacheStats[];
  timestamp: number;
  exceeded: boolean;
}

// Max cache size per cache (10MB recommended)
const MAX_CACHE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_CACHE_SIZE = 50 * 1024 * 1024; // 50MB total

async function estimateResponseSize(response: Response): Promise<number> {
  try {
    const clone = response.clone();
    const blob = await clone.blob();
    return blob.size;
  } catch {
    return 0;
  }
}

export async function getCacheStats(): Promise<CacheReport | null> {
  if (typeof caches === 'undefined') return null;

  try {
    const cacheNames = await caches.keys();
    const stats: CacheStats[] = [];
    let totalSize = 0;

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      let cacheSize = 0;

      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const size = await estimateResponseSize(response);
          cacheSize += size;
        }
      }

      stats.push({
        name: cacheName,
        size: cacheSize,
        entryCount: requests.length
      });

      totalSize += cacheSize;
    }

    return {
      totalSize,
      caches: stats,
      timestamp: Date.now(),
      exceeded: totalSize > MAX_TOTAL_CACHE_SIZE
    };
  } catch (error) {
    console.error('[Cache Monitor] Failed to get cache stats:', error);
    return null;
  }
}

export async function cleanupOldCaches(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
  if (typeof caches === 'undefined') return 0;

  let cleaned = 0;
  const now = Date.now();

  try {
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      // Skip current version caches (they include version numbers)
      if (/v\d+/.test(cacheName)) continue;

      const cache = await caches.open(cacheName);
      const requests = await cache.keys();

      for (const request of requests) {
        const response = await cache.match(request);
        if (!response) continue;

        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const cacheDate = new Date(dateHeader).getTime();
          if (now - cacheDate > maxAge) {
            await cache.delete(request);
            cleaned++;
          }
        }
      }
    }

    console.log(`[Cache Monitor] Cleaned ${cleaned} old cache entries`);
    return cleaned;
  } catch (error) {
    console.error('[Cache Monitor] Failed to cleanup old caches:', error);
    return 0;
  }
}

export async function cleanupLargestCache(): Promise<boolean> {
  const report = await getCacheStats();
  if (!report || !report.exceeded) return false;

  try {
    // Find the largest cache
    const largestCache = report.caches.reduce((prev, current) => 
      current.size > prev.size ? current : prev
    );

    console.log(`[Cache Monitor] Cleaning up largest cache: ${largestCache.name} (${(largestCache.size / 1024 / 1024).toFixed(2)}MB)`);

    const cache = await caches.open(largestCache.name);
    const requests = await cache.keys();

    // Delete half of the entries (oldest first, but we'll just delete the first half)
    const deleteCount = Math.floor(requests.length / 2);
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(requests[i]);
    }

    console.log(`[Cache Monitor] Deleted ${deleteCount} entries from ${largestCache.name}`);
    return true;
  } catch (error) {
    console.error('[Cache Monitor] Failed to cleanup largest cache:', error);
    return false;
  }
}

// Monitor cache size and report
export async function monitorCacheSize() {
  const report = await getCacheStats();
  if (!report) return;

  console.log('[Cache Monitor] Cache Report:', {
    totalSize: `${(report.totalSize / 1024 / 1024).toFixed(2)}MB`,
    cacheCount: report.caches.length,
    exceeded: report.exceeded
  });

  // Log individual cache sizes
  report.caches.forEach(cache => {
    const sizeMB = (cache.size / 1024 / 1024).toFixed(2);
    const status = cache.size > MAX_CACHE_SIZE ? '⚠️ LARGE' : '✓';
    console.log(`  ${status} ${cache.name}: ${sizeMB}MB (${cache.entryCount} entries)`);
  });

  // Trigger cleanup if exceeded
  if (report.exceeded) {
    console.warn('[Cache Monitor] Total cache size exceeded, triggering cleanup...');
    await cleanupLargestCache();
  }

  // Send to analytics
  if (typeof window !== 'undefined' && window.umami) {
    window.umami('pwa_cache_size', {
      totalSizeMB: Math.round(report.totalSize / 1024 / 1024),
      cacheCount: report.caches.length,
      exceeded: report.exceeded
    });
  }
}

// Initialize periodic cache monitoring (every 5 minutes)
export function initCacheMonitoring() {
  if (typeof window === 'undefined') return;

  // Initial check
  monitorCacheSize();

  // Periodic monitoring
  setInterval(() => {
    monitorCacheSize();
  }, 5 * 60 * 1000); // Every 5 minutes

  // Cleanup old caches daily
  setInterval(() => {
    cleanupOldCaches();
  }, 24 * 60 * 60 * 1000); // Every 24 hours
}
