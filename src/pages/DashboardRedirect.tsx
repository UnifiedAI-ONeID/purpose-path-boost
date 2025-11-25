import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { isMobileDevice } from '@/lib/deviceDetect';

/**
 * DashboardRedirect - Redirects authenticated users to the appropriate dashboard
 * - Clients → /me (full-featured client dashboard)
 * - Admins → /admin (admin control panel)
 * - Unauthenticated → /auth
 */
export default function DashboardRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    async function redirect() {
      try {
        console.log('[DashboardRedirect] Starting redirect logic');
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('[DashboardRedirect] Session check:', { 
          hasSession: !!session, 
          userId: session?.user?.id 
        });
        
        if (!session) {
          // Not authenticated - go to auth page
          console.log('[DashboardRedirect] No session, redirecting to auth');
          navigate('/auth?returnTo=/dashboard');
          return;
        }

        // Check admin status using edge function
        console.log('[DashboardRedirect] Calling admin check edge function');
        const { data: adminData, error: adminError } = await supabase.functions.invoke('api-admin-check-role', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        
        console.log('[DashboardRedirect] Admin check response:', { adminData, adminError });
        
        if (adminError) {
          console.error('[DashboardRedirect] Admin check error:', adminError);
          // Default to appropriate dashboard based on device
          const shouldUseMobile = isMobileDevice();
          const fallbackRoute = shouldUseMobile ? '/pwa/dashboard' : '/me';
          console.log('[DashboardRedirect] Error fallback to', fallbackRoute);
          navigate(fallbackRoute, { replace: true });
          return;
        }
        
        // Route based on role
        const isAdmin = adminData?.is_admin === true;
        console.log('[DashboardRedirect] Routing user:', { isAdmin, userId: session.user.id });
        
        if (isAdmin) {
          // Admins always go to /admin regardless of device
          console.log('[DashboardRedirect] Navigating admin to /admin');
          navigate('/admin', { replace: true });
        } else {
          // Check device preference for non-admin users
          let devicePreference: string | null = null;
          try {
            devicePreference = localStorage.getItem('zg.devicePreference');
          } catch (e) {
            console.warn('localStorage not available:', e);
          }
          
          const shouldUseMobile = devicePreference 
            ? devicePreference === 'mobile' 
            : isMobileDevice();
          
          // Route to appropriate dashboard based on device
          const targetRoute = shouldUseMobile ? '/pwa/dashboard' : '/me';
          console.log('[DashboardRedirect] Navigating user to', targetRoute, { shouldUseMobile });
          navigate(targetRoute, { replace: true });
        }
      } catch (error) {
        console.error('[DashboardRedirect] Error:', error);
        // Default to auth page on exception
        navigate('/auth?returnTo=/dashboard');
      }
    }

    redirect();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
