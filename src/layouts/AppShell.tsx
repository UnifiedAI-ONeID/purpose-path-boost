import { NavLink, Outlet } from "react-router-dom";
import { Home, User, BookOpen, GraduationCap } from "lucide-react";
import LangNudge from '@/prefs/LangNudge';

export default function AppShell() {
  const navItems = [
    { to: '/home', icon: Home, label: 'Home' },
    { to: '/coaching', icon: GraduationCap, label: 'Coaching' },
    { to: '/blog', icon: BookOpen, label: 'Blog' },
    { to: '/me', icon: User, label: 'Me' },
  ];

  return (
    <div className="mx-auto max-w-md h-dvh flex flex-col bg-bg">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <nav className="h-16 border-t border-border bg-surface">
        <ul className="grid grid-cols-4 h-full text-xs">
          {navItems.map((item) => (
            <Tab key={item.to} to={item.to} icon={item.icon} label={item.label} />
          ))}
        </ul>
      </nav>
      <LangNudge />
    </div>
  );
}

function Tab({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <li>
      <NavLink 
        to={to} 
        className={({ isActive }) =>
          "flex flex-col items-center justify-center h-full " +
          (isActive ? "text-fg font-medium" : "text-muted")
        }
      >
        <Icon size={22} />
        <span>{label}</span>
      </NavLink>
    </li>
  );
}
