import { useEffect } from "react";
import { useNav } from "@/nav/useNav";
import { ROUTES } from "@/nav/routes";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import SmartLink from "@/components/SmartLink";

const NotFound = () => {
  const nav = useNav();

  useEffect(() => {
    // Simple heuristics: try to map to closest known section
    const p = location.pathname;
    console.error("404 Error: User attempted to access non-existent route:", p);
    
    // Auto-redirect to closest matching route after 3 seconds
    const timer = setTimeout(() => {
      // Check if it's a PWA route
      if (p.startsWith('/pwa/')) {
        const target =
          p.includes('/coaching') ? ROUTES.coaching :
          p.includes('/quiz') ? ROUTES.quiz :
          p.includes('/dashboard') ? ROUTES.dashboard :
          ROUTES.home;
        
        nav.replace(nav.href(target), { animate: true });
        return;
      }
      
      // Public routes
      const target =
        p.includes('/coaching/') ? '/coaching' :
        p.includes('/coaching') ? '/coaching' :
        p.includes('/blog') ? '/blog' :
        p.includes('/events') ? '/events' :
        p.includes('/about') ? '/about' :
        p.includes('/contact') ? '/contact' :
        '/home';

      nav.replace(nav.href(target), { animate: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [nav]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-primary">
      <div className="text-center px-4">
        <h1 className="mb-4 text-9xl font-serif font-bold text-brand-accent">404</h1>
        <h2 className="mb-4 text-3xl font-serif font-semibold text-white">Page Not Found</h2>
        <p className="mb-8 text-xl text-white/80 max-w-md mx-auto">
          The path you're looking for doesn't exist. Redirecting you to the closest page...
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="hero" size="lg">
            <SmartLink to="/home">
              <Home className="mr-2 h-5 w-5" />
              Go Home Now
            </SmartLink>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
