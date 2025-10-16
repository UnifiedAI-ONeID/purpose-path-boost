/**
 * SEO indexing utilities for controlling crawler behavior
 */

/**
 * Check if current environment should be indexed by search engines
 */
export function shouldIndex(): boolean {
  const seoIndex = import.meta.env?.VITE_SEO_INDEX ?? 'true';
  const isPreview = import.meta.env?.MODE === 'preview' || 
                    window.location.hostname.includes('lovableproject.com') ||
                    window.location.hostname.includes('vercel.app');
  
  return seoIndex === 'true' && !isPreview;
}

/**
 * Check if a specific path should be indexed
 */
export function shouldIndexPath(path: string): boolean {
  if (!shouldIndex()) return false;
  
  // Never index admin, api, or auth routes
  const noIndexPaths = ['/admin', '/api', '/auth', '/_vercel'];
  if (noIndexPaths.some(p => path.startsWith(p))) return false;
  
  // Check for query params that indicate preview/draft
  const url = new URL(window.location.href);
  if (url.searchParams.has('preview') || url.searchParams.has('draft')) return false;
  
  return true;
}

/**
 * Get robots meta content for current environment
 */
export function getRobotsContent(customContent?: string): string {
  if (!shouldIndex()) return 'noindex,nofollow';
  return customContent || 'index,follow';
}

/**
 * Check if current hostname is a CN domain
 */
export function isCNDomain(): boolean {
  const cnDomains = ['zhengrowth.cn', 'cn.zhengrowth.com'];
  return cnDomains.some(d => window.location.hostname.endsWith(d));
}

/**
 * Get base URL for current environment
 */
export function getBaseURL(): string {
  if (isCNDomain()) {
    return `https://${window.location.hostname}`;
  }
  return 'https://zhengrowth.com';
}
