import { Outlet, useLocation } from 'react-router-dom';
import { Home, ClipboardList, LayoutDashboard, GraduationCap } from 'lucide-react';
import SmartLink from '@/components/SmartLink';
import { ROUTES } from '@/nav/routes';

export default function PWALayout() {
  const location = useLocation();
  
  const navItems = [
    { to: ROUTES.home, icon: Home, label: 'Home' },
    { to: ROUTES.quiz, icon: ClipboardList, label: 'Quiz' },
    { to: ROUTES.coaching, icon: GraduationCap, label: 'Programs' },
    { to: ROUTES.dashboard, icon: LayoutDashboard, label: 'Dashboard' },
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
            const isActive = location.pathname === item.to;
            
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
