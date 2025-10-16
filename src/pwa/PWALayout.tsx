import { Outlet, NavLink } from 'react-router-dom';
import { Home, ClipboardList, LayoutDashboard, GraduationCap } from 'lucide-react';

export default function PWALayout() {
  const navItems = [
    { to: '/pwa/home', icon: Home, label: 'Home' },
    { to: '/pwa/quiz', icon: ClipboardList, label: 'Quiz' },
    { to: '/pwa/coaching', icon: GraduationCap, label: 'Programs' },
    { to: '/pwa/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
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
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                    isActive 
                      ? 'text-primary font-semibold' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
