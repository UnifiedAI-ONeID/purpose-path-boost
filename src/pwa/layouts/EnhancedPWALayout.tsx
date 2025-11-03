import { Outlet, useLocation } from 'react-router-dom';
import { 
  Home, ClipboardList, LayoutDashboard, GraduationCap, 
  Brain, BarChart3, Calendar, Settings
} from 'lucide-react';
import SmartLink from '@/components/SmartLink';
import { usePWA } from '../core/PWAProvider';
import { OfflineIndicator } from '../core/OfflineIndicator';

export default function EnhancedPWALayout() {
  const location = useLocation();
  const { isGuest, isInstalled } = usePWA();

  // Main bottom nav items - always visible
  const mainNavItems = [
    { to: '/pwa', icon: Home, label: 'Home' },
    { to: '/pwa/content', icon: GraduationCap, label: 'Learn' },
    { to: '/pwa/ai', icon: Brain, label: 'AI' },
    { to: '/pwa/me', icon: LayoutDashboard, label: 'Me' },
  ];

  // Additional nav items in Me section
  const meNavItems = isGuest ? [] : [
    { to: '/pwa/goals', icon: ClipboardList, label: 'Goals' },
    { to: '/pwa/sessions', icon: Calendar, label: 'Sessions' },
    { to: '/pwa/analytics', icon: BarChart3, label: 'Insights' },
    { to: '/pwa/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-16 bg-background">
      <OfflineIndicator />
      
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isHome = item.to === '/pwa' && (location.pathname === '/pwa' || location.pathname === '/pwa/home');
            const isActive = isHome || location.pathname.startsWith(item.to);
            
            return (
              <SmartLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 ${
                  isActive 
                    ? 'text-primary font-semibold scale-105' 
                    : 'text-muted-foreground hover:text-foreground active:scale-95'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </SmartLink>
            );
          })}
        </div>
      </nav>

      {/* Install badge for web users */}
      {!isInstalled && (
        <div className="fixed top-4 right-4 z-40">
          <SmartLink
            to="/install"
            className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium shadow-lg hover:scale-105 transition-transform"
          >
            📲 Install App
          </SmartLink>
        </div>
      )}
    </div>
  );
}
