import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function MobileShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => 
    matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light'
  );
  
  useEffect(() => {
    const el = document.documentElement;
    if (theme === 'dark') {
      el.classList.add('dark');
    } else {
      el.classList.remove('dark');
    }
    
    // Update theme-color meta tag for PWA
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (meta) meta.content = theme === 'dark' ? '#0b1f1f' : '#ffffff';
  }, [theme]);

  return (
    <div 
      className="min-h-[100svh] bg-background text-foreground antialiased"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)', 
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)' 
      }}
    >
      <header 
        className="sticky top-0 z-40 backdrop-blur-md bg-card/75 border-b border-border"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="px-4 h-14 flex items-center justify-between">
          <a href="/home" className="flex items-center gap-2">
            <img 
              src="/app-icon.png" 
              alt="ZhenGrowth" 
              width={32} 
              height={32} 
              decoding="async"
              className="rounded-lg"
            />
            <span className="font-semibold text-base">ZhenGrowth</span>
          </a>
          <button 
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-card text-foreground shadow-sm border border-border hover:bg-accent transition-colors"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀︎ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>

      <main className="px-4 pb-4">
        {children}
      </main>

      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-4 h-16">
          <NavItem href="/home" label="Home" icon="🏠" />
          <NavItem href="/events" label="Events" icon="📅" />
          <NavItem href="/blog" label="Blog" icon="📖" />
          <NavItem href="/book" label="Book" icon="💬" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  const location = useLocation();
  const isActive = location.pathname === href;
  
  return (
    <a 
      href={href} 
      className={`flex flex-col items-center justify-center gap-1 text-xs transition-colors ${
        isActive ? 'text-primary font-medium' : 'text-muted-foreground'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </a>
  );
}

export function Section({ title, children, subtitle }: { 
  title: string; 
  subtitle?: string; 
  children: React.ReactNode 
}) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function MobileCard({ children, href }: { children: React.ReactNode; href?: string }) {
  const Component: any = href ? 'a' : 'div';
  return (
    <Component 
      href={href} 
      className="block rounded-2xl border border-border bg-card shadow-sm p-3 active:scale-[0.998] transition hover:shadow-md"
    >
      {children}
    </Component>
  );
}

export function MobileCTA({ children, href, onClick }: { 
  children: React.ReactNode; 
  href?: string; 
  onClick?: () => void 
}) {
  const Component: any = href ? 'a' : 'button';
  return (
    <Component 
      href={href} 
      onClick={onClick}
      className="w-full h-12 rounded-xl text-[15px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition inline-flex items-center justify-center"
    >
      {children}
    </Component>
  );
}

export function StatRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl bg-muted/50 border border-border p-3 text-center">
          <div className="text-xs text-muted-foreground">{it.label}</div>
          <div className="text-lg font-semibold mt-1">{it.value}</div>
        </div>
      ))}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`} />;
}