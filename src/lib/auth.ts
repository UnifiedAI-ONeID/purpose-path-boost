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
  // Firebase currentUser is sync but might need wait if called too early. 
  // Assuming this is called after app init.
  const user = authClient.currentUser;

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
  return !!authClient.currentUser;
}
