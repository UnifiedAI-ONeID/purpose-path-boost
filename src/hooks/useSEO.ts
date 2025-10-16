import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { shouldIndex, shouldIndexPath, getRobotsContent } from '@/lib/seo/indexing';

/**
 * Hook to manage dynamic SEO meta tags based on current route
 */
export function useSEO() {
  const location = useLocation();
  
  useEffect(() => {
    const path = location.pathname;
    const shouldIndexRoute = shouldIndexPath(path);
    
    // Update robots meta tag dynamically
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    
    robotsMeta.setAttribute('content', getRobotsContent(
      shouldIndexRoute ? 'index,follow' : 'noindex,nofollow'
    ));
    
    // Also update googlebot meta
    let googlebotMeta = document.querySelector('meta[name="googlebot"]');
    if (!googlebotMeta) {
      googlebotMeta = document.createElement('meta');
      googlebotMeta.setAttribute('name', 'googlebot');
      document.head.appendChild(googlebotMeta);
    }
    
    googlebotMeta.setAttribute('content', getRobotsContent(
      shouldIndexRoute ? 'index,follow' : 'noindex,nofollow'
    ));
  }, [location.pathname]);
  
  return {
    shouldIndex: shouldIndex(),
    shouldIndexPath: shouldIndexPath(location.pathname)
  };
}
