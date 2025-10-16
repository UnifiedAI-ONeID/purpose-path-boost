import { triggerHomeAnim } from '../anim/animator';

function getLangPref() {
  try {
    return (localStorage.getItem('zg.lang') || document.documentElement.getAttribute('lang') || 'en') as 'en'|'zh-CN'|'zh-TW';
  } catch { 
    return 'en'; 
  }
}

export type NavApi = {
  push: (href: string, opts?: { animate?: boolean }) => void;
  replace: (href: string, opts?: { animate?: boolean }) => void;
  openExternal: (href: string) => void;
  href: (path: string, params?: Record<string, string | number | undefined>) => string;
};

export function createNavAPI(
  routerPush: (u: string) => void, 
  routerReplace: (u: string) => void
): NavApi {
  const href = (path: string, params: Record<string, string | number | undefined> = {}) => {
    const u = new URL(path, location.origin);
    const cur = new URL(location.href);
    
    // Carry language always
    const lang = getLangPref();
    if (!u.searchParams.get('lang')) u.searchParams.set('lang', lang);
    
    // Carry ref/utm if present
    ['ref', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(k => {
      const val = cur.searchParams.get(k);
      if (val && !u.searchParams.get(k)) u.searchParams.set(k, val);
    });
    
    // Add custom params
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
    });
    
    return u.pathname + u.search + u.hash;
  };

  const push = (to: string, opts?: { animate?: boolean }) => {
    if (opts?.animate !== false) triggerHomeAnim(650);
    routerPush(to);
  };
  
  const replace = (to: string, opts?: { animate?: boolean }) => {
    if (opts?.animate !== false) triggerHomeAnim(650);
    routerReplace(to);
  };
  
  const openExternal = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

  return { push, replace, openExternal, href };
}

export function ensureHref(path: string) { 
  return createNavAPI(() => {}, () => {}).href(path); 
}
