import { NavLink, Outlet } from "react-router-dom";
import { Calendar, Home, User, BookOpen, Layers } from "lucide-react";

export default function AppShell() {
  return (
    <div className="mx-auto max-w-md h-dvh flex flex-col bg-bg">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <nav className="h-16 border-t border-border bg-surface">
        <ul className="grid grid-cols-5 h-full text-xs">
          <Tab to="/" icon={<Home size={22}/>} label="Home" />
          <Tab to="/coaching" icon={<Layers size={22}/>} label="Programs" />
          <Tab to="/book" icon={<Calendar size={22}/>} label="Book" />
          <Tab to="/blog" icon={<BookOpen size={22}/>} label="Resources" />
          <Tab to="/about" icon={<User size={22}/>} label="Me" />
        </ul>
      </nav>
    </div>
  );
}

function Tab({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <li>
      <NavLink 
        to={to} 
        className={({ isActive }) =>
          "flex flex-col items-center justify-center h-full " +
          (isActive ? "text-fg font-medium" : "text-muted")
        }
      >
        {icon}
        <span>{label}</span>
      </NavLink>
    </li>
  );
}
