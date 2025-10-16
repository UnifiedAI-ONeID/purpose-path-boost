import { Outlet, useLocation } from 'react-router-dom';
import { Home, ClipboardList, LayoutDashboard, GraduationCap } from 'lucide-react';
import SmartLink from '@/components/SmartLink';
import { ROUTES } from '@/nav/routes';

export default function PWALayout() {
  const location = useLocation();
  
  const navItems = [
    { to: '/pwa', icon: Home, label: 'Home' },
    { to: '/pwa/quiz', icon: ClipboardList, label: 'Quiz' },
    { to: '/pwa/coaching', icon: GraduationCap, label: 'Programs' },
    { to: '/pwa/dashboard', icon: LayoutDashboard, label: 'Me' },
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
