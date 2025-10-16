import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isMobileDevice } from '@/lib/deviceDetect';

/**
 * DeviceRouter Component
 * 
 * Automatically routes users based on their device type:
 * 
 * 📱 Mobile Devices → PWA routes (/pwa/*)
 * 💻 Desktop Devices → Regular website routes (/)
 * 
 * Route Mappings:
 * - / or /home → /pwa (mobile)
 * - /quiz → /pwa/quiz (mobile)
 * - /coaching → /pwa/coaching (mobile)
 * - /me or /dashboard → /pwa/dashboard (mobile)
 * 
 * Override Behavior:
 * - Add ?forceDesktop to stay on desktop version
 * - Add ?forceMobile to stay on mobile version
 * - Your preference is saved in localStorage
 * 
 * Protected Routes:
 * Admin, auth, and static pages (/admin, /auth, /blog, etc.) are never auto-redirected
 */

/**
 * Route mappings between desktop and PWA versions
 */
const ROUTE_MAPPINGS: { [key: string]: string } = {
  // Desktop to PWA
  '/': '/pwa',
  '/home': '/pwa',
  '/quiz': '/pwa/quiz',
  '/coaching': '/pwa/coaching',
  '/coaching-programs': '/pwa/coaching',
  '/me': '/pwa/dashboard',
  '/dashboard': '/pwa/dashboard',
  '/about': '/pwa/dashboard',
  
  // PWA to Desktop (reverse mappings)
  '/pwa': '/',
  '/pwa/home': '/',
  '/pwa/quiz': '/quiz',
  '/pwa/coaching': '/coaching',
  '/pwa/dashboard': '/me',
};

/**
 * Routes that should never be redirected (admin, auth, static pages, etc.)
 */
const EXCLUDED_ROUTES = [
  '/admin',
  '/auth',
  '/install',
  '/payment',
  '/thank-you',
  '/privacy',
  '/terms',
  '/blog',
  '/events',
  '/contact',
  '/book',
];

/**
 * DeviceRouter component
 * Automatically redirects users based on device type:
 * - Mobile devices → PWA routes (/pwa/*)
 * - Desktop devices → Regular routes (/)
 * 
 * Users can override with ?forceDesktop or ?forceMobile query params
 */
export default function DeviceRouter() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Don't redirect if on excluded routes
    if (EXCLUDED_ROUTES.some(route => currentPath.startsWith(route))) {
      return;
    }

    // Check for force parameters
    const searchParams = new URLSearchParams(location.search);
    const forceDesktop = searchParams.has('forceDesktop');
    const forceMobile = searchParams.has('forceMobile');

    // If user explicitly set a preference, respect it
    if (forceDesktop || forceMobile) {
      // Store preference
      if (forceDesktop) localStorage.setItem('zg.devicePreference', 'desktop');
      if (forceMobile) localStorage.setItem('zg.devicePreference', 'mobile');
      return;
    }

    // Check stored preference
    const storedPreference = localStorage.getItem('zg.devicePreference');
    let shouldUseMobile: boolean;
    
    if (storedPreference) {
      shouldUseMobile = storedPreference === 'mobile';
    } else {
      shouldUseMobile = isMobileDevice();
    }

    const isCurrentlyOnPWA = currentPath.startsWith('/pwa');

    // Mobile device/preference on desktop route → redirect to PWA
    if (shouldUseMobile && !isCurrentlyOnPWA) {
      const targetRoute = ROUTE_MAPPINGS[currentPath];
      if (targetRoute) {
        console.log('📱 Redirecting to PWA:', targetRoute);
        navigate(targetRoute + location.search, { replace: true });
      }
    }

    // Desktop device/preference on PWA route → redirect to desktop
    if (!shouldUseMobile && isCurrentlyOnPWA) {
      const targetRoute = ROUTE_MAPPINGS[currentPath];
      if (targetRoute) {
        console.log('💻 Redirecting to website:', targetRoute);
        navigate(targetRoute + location.search, { replace: true });
      }
    }
  }, [location.pathname, location.search, navigate]);

  // This component doesn't render anything
  return null;
}

