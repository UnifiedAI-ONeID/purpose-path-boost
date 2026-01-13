import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { registerAdminSW } from '../../pwa/registerAdminSW';
import AdminInstallButton from './AdminInstallButton';
import { triggerHomeAnim } from '@/anim/animator';
import { ADMIN_NAV } from '@/admin/nav';
import { useUserRole } from '@/hooks/useUserRole';
import logo from '@/assets/images/logo.png';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { role } = useUserRole();

  useEffect(() => {
    // Register admin SW
    registerAdminSW();
    
    // Apply admin theme
    document.documentElement.dataset.admin = 'true';
    
    return () => {
      delete document.documentElement.dataset.admin;
    };
  }, []);

  // Trigger animation on route change
  useEffect(() => {
    triggerHomeAnim(600);
  }, [location.pathname]);

  return (
    <div className="min-h-[100svh] grid md:grid-cols-[240px_1fr]" style={{ background: 'var(--background)' }}>
      <aside className={`border-r border-border ${open ? 'block' : 'hidden'} md:block`}>
        <div className="p-4 flex items-center gap-2">
          <img 
            src={logo} 
            alt="ZhenGrowth" 
            className="h-8 w-8 rounded-lg"
            onError={(e) => {
              e.currentTarget.src = '/app-icon-192.png';
            }}
          />
          <div className="font-semibold">ZhenGrowth · Admin</div>
        </div>
        <nav className="p-2 space-y-1">
          {ADMIN_NAV.filter(item => {
            // Show all items if no role restrictions, or if user role matches
            if (!item.roles || !role) return !item.roles;
            return item.roles.includes(role);
          }).map((item) => (
            <Nav key={item.href} href={item.href}>
              {item.label}
            </Nav>
          ))}
        </nav>
      </aside>
      <main>
        <header 
          className="rounded-2xl p-4 md:p-6 text-white m-4 mb-0"
          style={{ background: 'linear-gradient(120deg,#0e7c6b,#0b5f54)' }}
        >
          <button 
            className="md:hidden mb-2" 
            onClick={() => setOpen(o => !o)}
            title="Toggle navigation menu"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="text-2xl font-semibold">Admin</div>
          <div className="opacity-90">Grow with Clarity · 清晰成長</div>
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}

function Nav({ href, children }: { href: string; children: React.ReactNode }) {
  const location = useLocation();
  const active = location.pathname === href;
  return (
    <Link
      to={href}
      className={`block px-3 py-2 rounded-lg transition-colors ${
        active ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent'
      }`}
    >
      {children}
    </Link>
  );
}
