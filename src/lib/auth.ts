import { supabase } from '@/integrations/supabase/client';

/**
 * Logout user and clean up session
 */
export async function logout() {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
  }
  
  try {
    // Clean up redirect hints
    localStorage.removeItem('zg.returnTo');
    // Keep theme/lang prefs intact
  } catch (error) {
    console.error('Error cleaning localStorage:', error);
  }
  
  // Redirect to home
  window.location.replace('/');
}

/**
 * Ensure user is authenticated or redirect to auth page
 */
export async function ensureAuthedOrRedirect(returnTo: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
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
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}
