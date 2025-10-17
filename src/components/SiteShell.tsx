import { usePrefs } from '@/prefs/PrefsProvider';
import ThemeToggle from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import SmartLink from './SmartLink';
import { ROUTES } from '@/nav/routes';
import logo from '@/assets/images/logo.png';

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
        <SmartLink to={ROUTES.home} className="font-semibold flex items-center gap-2 text-text hover:opacity-80 transition-opacity">
          <img 
            src={logo} 
            alt="ZhenGrowth Logo" 
            className="h-8 w-8"
            loading="eager"
            onError={(e) => {
              e.currentTarget.src = '/app-icon-192.png';
            }}
          />
          <span>ZhenGrowth</span>
        </SmartLink>
        
        <nav className="flex items-center gap-2">
          <SmartLink className="btn btn-ghost text-sm" to={ROUTES.coaching}>
            {lang === 'zh-CN' ? '辅导' : lang === 'zh-TW' ? '輔導' : 'Coaching'}
          </SmartLink>
          <SmartLink className="btn btn-ghost text-sm hidden sm:inline-flex" to={ROUTES.events}>
            {lang === 'zh-CN' ? '活动' : lang === 'zh-TW' ? '活動' : 'Events'}
          </SmartLink>
          <SmartLink className="btn btn-ghost text-sm hidden sm:inline-flex" to={ROUTES.contact}>
            {lang === 'zh-CN' ? '联系' : lang === 'zh-TW' ? '聯絡' : 'Contact'}
          </SmartLink>
          <LanguageSwitcher />
          <ThemeToggle />
        </nav>
      </header>
      
      <main className="mx-auto max-w-container px-mobile py-4">
        {children}
      </main>
      
      <footer className="mt-6 py-6 border-t border-border text-sm text-muted bg-subtle">
        <div className="mx-auto max-w-container px-mobile text-center sm:text-left">
          © {new Date().getFullYear()} ZhenGrowth. 
          <SmartLink to={ROUTES.privacy} className="ml-4 hover:text-text transition-colors">
            {lang === 'zh-CN' ? '隐私' : lang === 'zh-TW' ? '隱私' : 'Privacy'}
          </SmartLink>
          <SmartLink to={ROUTES.terms} className="ml-4 hover:text-text transition-colors">
            {lang === 'zh-CN' ? '条款' : lang === 'zh-TW' ? '條款' : 'Terms'}
          </SmartLink>
        </div>
      </footer>
    </div>
  );
}
