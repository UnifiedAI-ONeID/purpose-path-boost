import { useEffect, useState } from 'react';
import { registerAdminSW } from '../../pwa/registerAdminSW';
import AdminInstallButton from './AdminInstallButton';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Register admin SW
    registerAdminSW();
    
    // Apply admin theme
    document.documentElement.dataset.admin = 'true';
    return () => {
      delete document.documentElement.dataset.admin;
    };
  }, []);

  return (
    <div className="min-h-[100svh] bg-background text-foreground grid md:grid-cols-[240px_1fr]">
      <aside className={`border-r border-border bg-card ${open ? 'block' : 'hidden'} md:block`}>
        <div className="p-4 font-semibold text-primary">ZG Admin</div>
        <nav className="p-2 grid gap-1 text-sm">
          <Nav href="/admin">Dashboard</Nav>
          <Nav href="/admin/bookings">Bookings</Nav>
          <Nav href="/admin/coaching">Coaching</Nav>
          <Nav href="/admin/events">Events</Nav>
          <Nav href="/admin/calendar">Calendar</Nav>
          <Nav href="/admin/pricing">Pricing</Nav>
          <Nav href="/admin/express">Express</Nav>
          <Nav href="/admin/social">Social</Nav>
          <Nav href="/admin/ai">AI</Nav>
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
