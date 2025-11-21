import { useEffect, useState } from 'react';
import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';

export function useAdminAuth() {
  const [ok, setOk] = useState<boolean | null>(null);
  
  useEffect(() => {
    (async () => {
      // Get current session to ensure we have an auth token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        console.log('[useAdminAuth] No session found, redirecting to auth');
        setOk(false);
        location.href = '/auth?returnTo=/admin';
        return;
      }

      console.log('[useAdminAuth] Checking admin role with auth token');
      const { data, error } = await supabase.functions.invoke('api-admin-check-role', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });
      
      console.log('[useAdminAuth] Admin check result:', { data, error });
      const isAdmin = !error && data?.is_admin === true;
      setOk(isAdmin);
      
      if (!isAdmin) {
        console.log('[useAdminAuth] User is not admin, redirecting to auth');
        location.href = '/auth?returnTo=/admin';
      } else {
        console.log('[useAdminAuth] User is admin, access granted');
      }
    })();
  }, []);
  
  return ok;
}
