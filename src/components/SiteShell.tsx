import { Link } from 'react-router-dom';
import { usePrefs } from '@/prefs/PrefsProvider';
import ThemeToggle from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

type Props = {
  children: React.ReactNode;
};

/**
 * SiteShell - Main layout wrapper for public pages
 * Uses design system tokens for consistent theming
 */
export default function SiteShell({ children }: Props) {
  const { lang } = usePrefs();
  
  return (
    <div className="min-h-[100svh] bg-bg text-text">
      <header className="h-14 px-4 border-b border-border bg-surface flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-surface/90">
        <Link to="/" className="font-semibold flex items-center gap-2 text-text hover:opacity-80 transition-opacity">
          <span className="text-2xl">🍃</span>
          <span>ZhenGrowth</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-2">
          <Link className="btn btn-ghost px-3 py-2 h-auto" to="/coaching">
            {lang === 'zh-CN' ? '辅导' : lang === 'zh-TW' ? '輔導' : 'Coaching'}
          </Link>
          <Link className="btn btn-ghost px-3 py-2 h-auto" to="/events">
            {lang === 'zh-CN' ? '活动' : lang === 'zh-TW' ? '活動' : 'Events'}
          </Link>
          <Link className="btn btn-ghost px-3 py-2 h-auto" to="/contact">
            {lang === 'zh-CN' ? '联系' : lang === 'zh-TW' ? '聯絡' : 'Contact'}
          </Link>
          <LanguageSwitcher />
          <ThemeToggle />
        </nav>
      </header>
      
      <main className="mx-auto max-w-container px-mobile py-6">
        {children}
      </main>
      
      <footer className="mt-12 py-8 border-t border-border text-sm text-muted bg-subtle">
        <div className="mx-auto max-w-container px-mobile flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} ZhenGrowth. All rights reserved.</div>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-text transition-colors">
              {lang === 'zh-CN' ? '隐私' : lang === 'zh-TW' ? '隱私' : 'Privacy'}
            </Link>
            <Link to="/terms" className="hover:text-text transition-colors">
              {lang === 'zh-CN' ? '条款' : lang === 'zh-TW' ? '條款' : 'Terms'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
