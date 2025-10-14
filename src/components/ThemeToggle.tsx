import { useEffect, useState } from 'react';

function systemPrefersDark(){
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

export default function ThemeToggle(){
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('zg_theme');
    return saved ? saved === 'dark' : systemPrefersDark();
  });

  useEffect(()=>{
    const root = document.documentElement;
    if (dark) { 
      root.classList.add('dark'); 
      root.setAttribute('data-theme','dark'); 
    } else { 
      root.classList.remove('dark'); 
      root.removeAttribute('data-theme'); 
    }
    localStorage.setItem('zg_theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      onClick={()=>setDark(v=>!v)}
      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-surface text-fg shadow-soft border border-border hover:bg-border/50 transition-colors"
      aria-label="Toggle theme"
    >
      {dark ? '🌙 Dark' : '🌤️ Light'}
    </button>
  );
}
