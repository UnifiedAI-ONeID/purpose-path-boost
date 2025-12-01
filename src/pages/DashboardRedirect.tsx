import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '@/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { isMobileDevice } from '@/lib/deviceDetect';

const checkAdminRole = httpsCallable(functions, 'admin-check-role');

/**
 * DashboardRedirect - Redirects authenticated users to the appropriate dashboard
 * - Clients → /me (full-featured client dashboard)
 * - Admins → /admin (admin control panel)
 * - Unauthenticated → /auth
 */
export default function DashboardRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        console.log('[DashboardRedirect] Starting redirect logic');
        if (!user) {
          console.log('[DashboardRedirect] No session, redirecting to auth');
          navigate('/auth?returnTo=/dashboard');
          return;
        }

        console.log('[DashboardRedirect] Calling admin check function');
        const result = await checkAdminRole();
        const adminData = result.data as any; // Assuming data is of a certain type

        console.log('[DashboardRedirect] Admin check response:', { adminData });

        const isAdmin = adminData?.is_admin === true;
        console.log('[DashboardRedirect] Routing user:', { isAdmin, userId: user.uid });

        if (isAdmin) {
          console.log('[DashboardRedirect] Navigating admin to /admin');
          navigate('/admin', { replace: true });
        } else {
          let devicePreference: string | null = null;
          try {
            devicePreference = localStorage.getItem('zg.devicePreference');
          } catch (e) {
            console.warn('localStorage not available:', e);
          }

          const shouldUseMobile = devicePreference
            ? devicePreference === 'mobile'
            : isMobileDevice();

          const targetRoute = shouldUseMobile ? '/pwa/dashboard' : '/me';
          console.log('[DashboardRedirect] Navigating user to', targetRoute, { shouldUseMobile });
          navigate(targetRoute, { replace: true });
        }
      } catch (error) {
        console.error('[DashboardRedirect] Error:', error);
        const shouldUseMobile = isMobileDevice();
        const fallbackRoute = shouldUseMobile ? '/pwa/dashboard' : '/me';
        console.log('[DashboardRedirect] Error fallback to', fallbackRoute);
        navigate(fallbackRoute, { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
