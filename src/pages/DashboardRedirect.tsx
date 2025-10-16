import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { invokeApi } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';

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
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Not authenticated - go to auth page
          navigate('/auth?returnTo=/dashboard');
          return;
        }

        // Check admin status
        const data = await invokeApi('/api/admin/check-role', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        // Route based on role
        if (data.is_admin) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/me', { replace: true });
        }
      } catch (error) {
        console.error('Dashboard redirect error:', error);
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
