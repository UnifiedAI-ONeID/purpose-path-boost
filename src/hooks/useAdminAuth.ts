import { useEffect, useState } from 'react';
import { auth, functions } from '@/firebase/config';
import { httpsCallable } from 'firebase/functions';
import { onAuthStateChanged } from 'firebase/auth';

const checkAdminRoleFn = httpsCallable(functions, 'admin-check-role');

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('[useAdminAuth] User is signed in, checking admin role.');
        try {
          const result = await checkAdminRoleFn();
          const { isAdmin: isAdminResult } = result.data as { isAdmin: boolean };

          console.log('[useAdminAuth] Admin check result:', { isAdmin: isAdminResult });

          if (isAdminResult) {
            setIsAdmin(true);
            console.log('[useAdminAuth] User is admin, access granted.');
          } else {
            setIsAdmin(false);
            console.log('[useAdminAuth] User is not an admin, redirecting to auth.');
            window.location.href = '/auth?returnTo=/admin';
          }
        } catch (error) {
          console.error('[useAdminAuth] Error checking admin role:', error);
          setIsAdmin(false);
          window.location.href = '/auth?returnTo=/admin';
        }
      } else {
        console.log('[useAdminAuth] No user signed in, redirecting to auth.');
        setIsAdmin(false);
        window.location.href = '/auth?returnTo=/admin';
      }
    });

    return () => unsubscribe();
  }, []);

  return isAdmin;
}
