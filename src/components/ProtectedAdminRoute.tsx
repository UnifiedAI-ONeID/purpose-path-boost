import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // Check if user has admin role
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        toast.error('Access denied');
      } else if (!data) {
        setIsAdmin(false);
        toast.error('Admin access required');
      } else {
        setIsAdmin(true);
      }
    } catch (err) {
      console.error('Admin check failed:', err);
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
    return <Navigate to="/auth?redirect=/admin" replace />;
  }

  // Render protected content for admin users
  return <>{children}</>;
}
