import { useNav } from './useNav';

function getLangPref() {
  try {
    return (localStorage.getItem('zg.lang') || document.documentElement.getAttribute('lang') || 'en') as 'en'|'zh-CN'|'zh-TW';
  } catch { 
    return 'en'; 
  }
}

/**
 * Hook for opening external URLs (Cal.com, Airwallex, etc.)
 * with proper language parameter preservation
 */
export function useExternalNav() {
  const nav = useNav();
  
  function openCal(url: string) {
    const u = new URL(url);
    u.searchParams.set('lang', getLangPref());
    nav.openExternal(u.toString());
  }
  
  function openAirwallex(url: string) {
    // Airwallex infers locale from browser but carry return URL with lang
    nav.openExternal(url);
  }
  
  function openExternal(url: string, preserveLang = true) {
    if (preserveLang) {
      try {
        const u = new URL(url);
        if (!u.searchParams.get('lang')) {
          u.searchParams.set('lang', getLangPref());
        }
        nav.openExternal(u.toString());
      } catch {
        nav.openExternal(url);
      }
    } else {
      nav.openExternal(url);
    }
  }
  
  return { openCal, openAirwallex, openExternal };
}
