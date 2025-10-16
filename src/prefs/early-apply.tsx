/**
 * EarlyApply - Inline script that applies theme and language BEFORE React hydration
 * Prevents flash of unstyled content (FOUC) on page load
 */
export const EarlyApply = () => (
  <script dangerouslySetInnerHTML={{__html:`(function(){try{
    var d=document.documentElement;
    var s=localStorage.getItem('zg.theme');
    var m=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;
    var t=s||'auto';
    var r=t==='dark'?'dark':t==='light'?'light':(m?'dark':'light');
    d.setAttribute('data-theme',r);
    if(r==='dark')d.classList.add('dark');
    var meta=document.querySelector('meta[name="theme-color"]')||(function(){var x=document.createElement('meta');x.name='theme-color';document.head.appendChild(x);return x})();
    meta.setAttribute('content', r==='dark' ? '#0b1f1f' : '#ffffff');
    var q=new URLSearchParams(location.search).get('lang');
    var sl=localStorage.getItem('zg.lang');
    var nl=(navigator.language||'en').toLowerCase();
    var al= nl.startsWith('zh-tw')||nl.startsWith('zh-hk') ? 'zh-TW' : (nl.startsWith('zh')?'zh-CN':'en');
    var L=(q||sl||al); 
    d.setAttribute('lang',L); 
    if(q) localStorage.setItem('zg.lang',L);
  }catch(e){}})()`}}/>
);
