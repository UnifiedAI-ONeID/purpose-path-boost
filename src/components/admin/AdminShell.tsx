import { useEffect, useState } from 'react';
import { registerAdminSW } from '../../pwa/registerAdminSW';
import AdminInstallButton from './AdminInstallButton';
import TransitionOverlay from '../motion/TransitionOverlay';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pathname, setPathname] = useState('');
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // Register admin SW
    registerAdminSW();
    
    // Apply admin theme
    document.documentElement.dataset.admin = 'true';
    
    // Track initial pathname
    setPathname(window.location.pathname);
    
    return () => {
      delete document.documentElement.dataset.admin;
    };
  }, []);

  // Detect route changes
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (pathname && currentPath !== pathname) {
      setAnimating(true);
      const timer = setTimeout(() => {
        setAnimating(false);
        setPathname(currentPath);
      }, 380);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Listen for navigation events
  useEffect(() => {
    const handleNavigation = () => {
      const newPath = window.location.pathname;
      if (newPath !== pathname) {
        setPathname(newPath);
      }
    };

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, [pathname]);

  return (
    <div className="min-h-[100svh] bg-background text-foreground grid md:grid-cols-[240px_1fr]">
      <TransitionOverlay show={animating} minDurationMs={350} />
      <aside className={`border-r border-border bg-card ${open ? 'block' : 'hidden'} md:block`}>
        <div className="p-4 font-semibold text-primary">ZG Admin</div>
        <nav className="p-2 grid gap-1 text-sm">
          <Nav href="/admin">Dashboard</Nav>
          <div className="mt-3 mb-1 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Bookings
          </div>
          <Nav href="/admin/bookings">All Bookings</Nav>
          <Nav href="/admin/cal-bookings">Cal.com Bookings</Nav>
          <Nav href="/admin/calendar">Calendar View</Nav>
          
          <div className="mt-3 mb-1 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Products
          </div>
          <Nav href="/admin/coaching">Coaching</Nav>
          <Nav href="/admin/events">Events</Nav>
          <Nav href="/admin/express">Express Pay</Nav>
          
          <div className="mt-3 mb-1 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Settings
          </div>
          <Nav href="/admin/pricing">Pricing & FX</Nav>
          <Nav href="/admin/ai">AI System</Nav>
        </nav>
      </aside>
      <main>
        <header className="sticky top-0 bg-card/80 backdrop-blur border-b border-border h-14 flex items-center justify-between px-4 z-10">
          <button className="md:hidden" onClick={() => setOpen(o => !o)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="font-semibold">Admin</div>
          <div className="flex items-center gap-2">
            <AdminInstallButton />
            <a className="text-sm hover:text-primary transition-colors" href="/">View site</a>
          </div>
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}

function Nav({ href, children }: { href: string; children: React.ReactNode }) {
  const active = typeof window !== 'undefined' && location.pathname === href;
  return (
    <a
      href={href}
      className={`px-3 py-2 rounded-lg transition-colors ${
        active ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent'
      }`}
    >
      {children}
    </a>
  );
}
