import { authClient } from '@/auth';
import { getRedirectResult, onAuthStateChanged } from 'firebase/auth';

/**
 * Logs out the current user, clears any relevant session data, and redirects to the homepage.
 */
export const logout = async (): Promise<void> => {
  try {
    await authClient.signOut();
    localStorage.removeItem('zg.returnTo');
    window.location.replace('/');
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

/**
 * Checks if a user is authenticated. If not, it stores the intended return path 
 * and redirects them to the authentication page.
 * @param returnTo - The URL path to return to after successful authentication.
 * @returns A promise that resolves to true if the user is authenticated, otherwise false.
 */
export const ensureAuthedOrRedirect = async (returnTo: string): Promise<boolean> => {
  const user = await isAuthenticated();
  if (!user) {
    localStorage.setItem('zg.returnTo', returnTo);
    window.location.href = `/auth?returnTo=${encodeURIComponent(returnTo)}`;
    return false;
  }
  return true;
};

/**
 * Checks the current authentication state of the user.
 * @returns A promise that resolves with the current user if authenticated, otherwise null.
 */
export const isAuthenticated = (): Promise<any | null> => {
  return new Promise(resolve => {
    onAuthStateChanged(authClient, user => {
      resolve(user);
    });
  });
};

/**
 * Handles the result from a redirect-based authentication flow.
 * @returns A promise that resolves with the user credential upon successful authentication, otherwise null.
 */
export const handleRedirectResult = async () => {
  try {
    return await getRedirectResult(authClient);
  } catch (error) {
    console.error('Authentication redirect error:', error);
    return null;
  }
};
