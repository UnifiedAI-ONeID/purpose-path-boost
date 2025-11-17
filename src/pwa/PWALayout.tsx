import { Outlet, useLocation } from 'react-router-dom';
import { Home, ClipboardList, LayoutDashboard, GraduationCap } from 'lucide-react';
import SmartLink from '@/components/SmartLink';
import { ROUTES } from '@/nav/routes';
import { usePrefs } from '@/prefs/PrefsProvider';

export default function PWALayout() {
  const location = useLocation();
  const { lang } = usePrefs();
  
  const getLabel = (key: string) => {
    const translations = {
      home: {
        'en': 'Home',
        'zh-CN': '首页',
        'zh-TW': '首頁'
      },
      quiz: {
        'en': 'Quiz',
        'zh-CN': '测评',
        'zh-TW': '測評'
      },
      programs: {
        'en': 'Programs',
        'zh-CN': '课程',
        'zh-TW': '課程'
      },
      me: {
        'en': 'Me',
        'zh-CN': '我的',
        'zh-TW': '我的'
      }
    };
    return translations[key as keyof typeof translations]?.[lang] || translations[key as keyof typeof translations]?.['en'];
  };

  const navItems = [
    { to: '/pwa', icon: Home, label: getLabel('home') },
    { to: '/pwa/quiz', icon: ClipboardList, label: getLabel('quiz') },
    { to: '/pwa/coaching', icon: GraduationCap, label: getLabel('programs') },
    { to: '/pwa/dashboard', icon: LayoutDashboard, label: getLabel('me') },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <main className="flex-1">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Handle both /pwa and /pwa/home as home route
            const isHome = item.to === '/pwa' && (location.pathname === '/pwa' || location.pathname === '/pwa/home');
            const isActive = isHome || location.pathname === item.to;
            
            return (
              <SmartLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                  isActive 
                    ? 'text-primary font-semibold' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </SmartLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
