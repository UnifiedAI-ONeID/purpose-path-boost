
import { authClient } from '@/auth';

/**
 * Logout user and clean up session
 */
export async function logout() {
  try {
    await authClient.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
  }
  
  try {
    localStorage.removeItem('zg.returnTo');
  } catch (error) {
    console.error('Error cleaning localStorage:', error);
  }
  
  window.location.replace('/');
}

/**
 * Ensure user is authenticated or redirect to auth page
 */
export async function ensureAuthedOrRedirect(returnTo: string): Promise<boolean> {
  const authProvider = import.meta.env.VITE_AUTH_PROVIDER || 'supabase';
  let user;

  if (authProvider === 'firebase') {
    user = authClient.currentUser;
  } else {
    const { data } = await authClient.getUser();
    user = data.user;
  }

  if (!user) {
    localStorage.setItem('zg.returnTo', returnTo);
    window.location.href = `/auth?returnTo=${encodeURIComponent(returnTo)}`;
    return false;
  }
  
  return true;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const authProvider = import.meta.env.VITE_AUTH_PROVIDER || 'supabase';

  if (authProvider === 'firebase') {
    return !!authClient.currentUser;
  } else {
    const { data: { session } } = await authClient.getSession();
    return !!session;
  }
}
