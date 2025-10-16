import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { registerAdminSW } from '../../pwa/registerAdminSW';
import AdminInstallButton from './AdminInstallButton';
import { triggerHomeAnim } from '@/anim/animator';
import { usePrefs } from '@/prefs/PrefsProvider';
import { at } from '@/i18n/admin';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { lang } = usePrefs();
  const [open, setOpen] = useState(false);
  const [pathname, setPathname] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    verifyAdminAccess();
    
    // Register admin SW
    registerAdminSW();
    
    // Apply admin theme
    document.documentElement.dataset.admin = 'true';
    
    // Track initial pathname
    setPathname(window.location.pathname);
    
    return () => {
      delete document.documentElement.dataset.admin;
    };
  }, [navigate]);

  async function verifyAdminAccess() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast.error('Authentication required');
        navigate('/auth?redirect=/admin');
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error || !data) {
        toast.error('Admin access required');
        navigate('/');
        return;
      }

      setIsVerified(true);
    } catch (err) {
      console.error('Admin verification failed:', err);
      toast.error('Access verification failed');
      navigate('/');
    }
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Detect route changes
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (pathname && currentPath !== pathname) {
      triggerHomeAnim(600);
      setPathname(currentPath);
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
      <aside className={`border-r border-border bg-card ${open ? 'block' : 'hidden'} md:block`}>
        <div className="p-4 font-semibold text-primary">ZG Admin</div>
        <nav className="p-2 grid gap-1 text-sm">
          <Nav href="/admin">{at(lang, 'Dashboard')}</Nav>
          <div className="mt-3 mb-1 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {at(lang, 'Bookings')}
          </div>
          <Nav href="/admin/bookings">{at(lang, 'Bookings')}</Nav>
          <Nav href="/admin/cal-bookings">Cal.com</Nav>
          <Nav href="/admin/calendar">{at(lang, 'Calendar')}</Nav>
          
          <div className="mt-3 mb-1 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {at(lang, 'Products')}
          </div>
          <Nav href="/admin/coaching">{at(lang, 'Coaching')}</Nav>
          <Nav href="/admin/events">{at(lang, 'Events')}</Nav>
          <Nav href="/admin/express">{at(lang, 'Express')}</Nav>
          
          <div className="mt-3 mb-1 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {at(lang, 'Marketing')}
          </div>
          <Nav href="/admin/coupons">Coupons</Nav>
          
          <div className="mt-3 mb-1 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {at(lang, 'Settings')}
          </div>
          <Nav href="/admin/pricing">{at(lang, 'Pricing')}</Nav>
          <Nav href="/admin/ai">{at(lang, 'AI')}</Nav>
          <Nav href="/admin/seo">SEO Monitor</Nav>
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
            <a className="text-sm hover:text-primary transition-colors" href="/">{at(lang, 'ViewSite')}</a>
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
