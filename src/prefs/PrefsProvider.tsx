import React from 'react';
import { postPref, onPref } from './bus';

type Theme = 'light'|'dark'|'auto';
type Lang = 'en'|'zh-CN'|'zh-TW';

type Prefs = {
  theme: Theme;
  resolvedTheme: 'light'|'dark';
  setTheme: (t:Theme)=>void;
  lang: Lang;
  setLang: (l:Lang)=>void;
};

const Ctx = React.createContext<Prefs | null>(null);

// Internal component that uses hooks - only called when React is ready
function PrefsProviderInternal({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>('auto');
  const [lang, setLangState] = React.useState<Lang>('en');
  const [systemDark, setSystemDark] = React.useState<boolean>(false);
  
  // Initialize from storage on mount
  React.useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('zg.theme') as Theme;
      const savedLang = localStorage.getItem('zg.lang') as Lang;
      const docLang = document.documentElement.getAttribute('lang') as Lang;
      const isDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
      
      if (savedTheme) setThemeState(savedTheme);
      if (savedLang) setLangState(savedLang);
      else if (docLang) setLangState(docLang);
      setSystemDark(isDark);
    } catch (e) {
      // Fail silently if localStorage not available
      console.warn('[Prefs] Init failed:', e);
    }
  }, []);

  // Watch system changes
  React.useEffect(()=>{
    if (typeof window === 'undefined' || !window.matchMedia) return;
    
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = (e:MediaQueryListEvent)=> setSystemDark(e.matches);
    mq.addEventListener?.('change', on);
    return ()=> mq.removeEventListener?.('change', on);
  },[]);

  // Apply theme to DOM + theme-color meta + persist + broadcast
  React.useEffect(()=>{
    const resolved: 'light'|'dark' = theme==='dark'?'dark': theme==='light'?'light' : (systemDark?'dark':'light');
    const doc = document.documentElement;
    doc.setAttribute('data-theme', resolved);
    if (resolved === 'dark') {
      doc.classList.add('dark');
    } else {
      doc.classList.remove('dark');
    }
    
    // Update PWA theme-color meta
    let m = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!m) { 
      m = document.createElement('meta'); 
      m.name='theme-color'; 
      document.head.appendChild(m); 
    }
    m.setAttribute('content', resolved==='dark' ? '#0b1f1f' : '#ffffff');
    
    // Update iOS PWA status bar style
    let ios = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement | null;
    if (!ios) { 
      ios = document.createElement('meta'); 
      ios.name='apple-mobile-web-app-status-bar-style'; 
      document.head.appendChild(ios); 
    }
    ios.setAttribute('content', resolved==='dark' ? 'black-translucent' : 'default');
    
    localStorage.setItem('zg.theme', theme);
    document.cookie = `zg_theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Sync with i18next if available
    if (window.i18next && window.i18next.language !== lang) {
      window.i18next.changeLanguage(lang);
    }

    // Broadcast to other tabs/PWAs
    postPref({ kind:'theme', value:theme, resolved });
  },[theme, systemDark, lang]);

  // Apply language to DOM and sync with i18next
  React.useEffect(()=>{
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('zg.lang', lang);
    document.cookie = `zg_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Sync with i18next if available
    if (window.i18next && window.i18next.language !== lang) {
      window.i18next.changeLanguage(lang);
    }
    
    // Broadcast to other tabs/PWAs
    postPref({ kind:'lang', value: lang });
  },[lang]);

  // Listen for external changes (other tabs/PWAs)
  React.useEffect(()=>{
    return onPref((p)=>{
      if (p.kind==='theme') {
        // Only auto-apply if we're on auto mode, otherwise respect local preference
        if (theme==='auto') {
          const doc = document.documentElement;
          doc.setAttribute('data-theme', p.resolved);
          if (p.resolved === 'dark') {
            doc.classList.add('dark');
          } else {
            doc.classList.remove('dark');
          }
          const m = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
          m?.setAttribute('content', p.resolved==='dark' ? '#0b1f1f' : '#ffffff');
          const ios = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement | null;
          ios?.setAttribute('content', p.resolved==='dark' ? 'black-translucent' : 'default');
        } else if (p.value !== theme) {
          // Another tab changed the theme preference explicitly
          setThemeState(p.value);
        }
      } else if (p.kind==='lang') {
        // Always sync language changes immediately
        if (p.value !== lang) {
          setLangState(p.value);
        }
      }
    });
  },[theme, lang]);

  const value = React.useMemo(()=>{
    const resolved: 'light'|'dark' = theme==='dark'?'dark': theme==='light'?'light' : (systemDark?'dark':'light');
    return {
      theme,
      resolvedTheme: resolved,
      setTheme: (t:Theme)=>setThemeState(t),
      lang,
      setLang: (l:Lang)=>setLangState(l)
    };
  },[theme, systemDark, lang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Main export
export function PrefsProvider({ children }:{ children: React.ReactNode }){
  return <PrefsProviderInternal>{children}</PrefsProviderInternal>;
}

export function usePrefs(){
  const v = React.useContext(Ctx);
  if (!v) throw new Error('usePrefs must be used within PrefsProvider');
  return v;
}

declare global {
  interface Window {
    i18next?: any;
  }
}
