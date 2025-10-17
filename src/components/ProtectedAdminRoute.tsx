import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { invokeApi } from '@/lib/api-client';

type Props = {
  children: React.ReactNode;
};

/**
 * ProtectedAdminRoute - Ensures only authenticated admin users can access wrapped routes
 * Redirects non-admin users to auth page
 */
export default function ProtectedAdminRoute({ children }: Props) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      console.log('[ProtectedAdminRoute] Starting admin access check');
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('[ProtectedAdminRoute] Session check:', {
        hasSession: !!session,
        userId: session?.user?.id,
        sessionError
      });
      
      if (sessionError || !session?.user) {
        console.log('[ProtectedAdminRoute] No valid session');
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // Check admin status via Edge Function WITH authorization header
      console.log('[ProtectedAdminRoute] Calling admin check with auth token');
      const data = await invokeApi('/api/admin/check-role', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      console.log('[ProtectedAdminRoute] Admin check response:', data);

      if (!data?.ok || !data?.authed || !data?.is_admin) {
        console.log('[ProtectedAdminRoute] User is not admin:', data);
        setIsAdmin(false);
        toast.error('Admin access required');
      } else {
        console.log('[ProtectedAdminRoute] User is admin, granting access');
        setIsAdmin(true);
      }
    } catch (err) {
      console.error('[ProtectedAdminRoute] Admin check failed:', err);
      setIsAdmin(false);
      toast.error('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/auth?returnTo=/admin" replace />;
  }

  // Render protected content for admin users
  return <>{children}</>;
}
