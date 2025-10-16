import { useEffect, useState } from 'react';
import { usePrefs } from '@/prefs/PrefsProvider';

/**
 * Language-aware fetch hook that automatically includes lang parameter
 * and Accept-Language header based on current preference.
 * 
 * Automatically refetches when language changes.
 * 
 * @example
 * ```tsx
 * const { data, loading, lang } = useI18nFetch<CoachingData>(`/api/coaching/get?slug=${slug}`);
 * 
 * // Or with dynamic URL based on lang
 * const { data, loading } = useI18nFetch<CoachingData>(
 *   (lang) => `/api/coaching/list?lang=${lang}`
 * );
 * ```
 */
export function useI18nFetch<T = any>(
  url: string | ((lang: string) => string),
  deps: any[] = []
) {
  const { lang } = usePrefs();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    
    (async () => {
      setLoading(true);
      setError(null);
      
      try {
        const href = typeof url === 'function' ? url(lang) : url;
        const u = new URL(href, location.origin);
        
        // Add lang param if not present
        if (!u.searchParams.get('lang')) {
          u.searchParams.set('lang', lang);
        }
        
        const response = await fetch(u.toString(), {
          headers: { 
            'Accept': 'application/json',
            'Accept-Language': lang 
          }
        });
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response format');
        }
        
        const result = await response.json();
        
        if (!alive) return;
        
        setData(result as T);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Fetch failed');
        setData(null);
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();
    
    return () => { 
      alive = false; 
    };
  }, [lang, url, ...deps]);

  return { data, loading, error, lang };
}
