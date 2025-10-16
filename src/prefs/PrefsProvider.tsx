import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light'|'dark'|'auto';
type Lang = 'en'|'zh-CN'|'zh-TW';

type Prefs = {
  theme: Theme;
  resolvedTheme: 'light'|'dark';
  setTheme: (t:Theme)=>void;
  lang: Lang;
  setLang: (l:Lang)=>void;
};

const Ctx = createContext<Prefs | null>(null);

export function PrefsProvider({ children }:{ children: React.ReactNode }){
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('zg.theme') as Theme) || 'auto');
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('zg.lang') as Lang) || (document.documentElement.getAttribute('lang') as Lang) || 'en');
  const [systemDark, setSystemDark] = useState<boolean>(matchMedia('(prefers-color-scheme: dark)').matches);

  // Watch system changes
  useEffect(()=>{
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = (e:MediaQueryListEvent)=> setSystemDark(e.matches);
    mq.addEventListener?.('change', on);
    return ()=> mq.removeEventListener?.('change', on);
  },[]);

  // Apply theme to DOM + theme-color meta
  useEffect(()=>{
    const resolved = theme==='dark'?'dark': theme==='light'?'light' : (systemDark?'dark':'light');
    const doc = document.documentElement;
    doc.setAttribute('data-theme', resolved);
    if (resolved === 'dark') {
      doc.classList.add('dark');
    } else {
      doc.classList.remove('dark');
    }
    const m = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (m) m.setAttribute('content', resolved==='dark' ? '#0b1f1f' : '#ffffff');
    localStorage.setItem('zg.theme', theme);
    document.cookie = `zg_theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  },[theme, systemDark]);

  // Apply language to DOM and sync with i18next
  useEffect(()=>{
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('zg.lang', lang);
    document.cookie = `zg_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Sync with i18next if available
    if (window.i18next && window.i18next.language !== lang) {
      window.i18next.changeLanguage(lang);
    }
  },[lang]);

  const value = useMemo(()=>{
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

export function usePrefs(){
  const v = useContext(Ctx);
  if (!v) throw new Error('usePrefs must be used within PrefsProvider');
  return v;
}

declare global {
  interface Window {
    i18next?: any;
  }
}
