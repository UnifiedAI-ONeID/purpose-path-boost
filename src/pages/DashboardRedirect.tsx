/**
 * @file This component handles the initial routing of a user after login.
 * It checks the user's role (admin or client) and device type to redirect them
 * to the appropriate dashboard experience.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '@/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { isMobileDevice } from '@/lib/deviceDetect';
import { logger } from '@/lib/log';

// --- Type Definitions ---

interface AdminCheckResponse {
  is_admin: boolean;
}

// --- Firebase Cloud Function Reference ---

const checkAdminRole = httpsCallable<void, AdminCheckResponse>(functions, 'admin-check-role');

// --- Business Logic ---

class RedirectManager {
  private navigate: ReturnType<typeof useNavigate>;

  constructor(navigate: ReturnType<typeof useNavigate>) {
    this.navigate = navigate;
  }

  public async handleUser(user: User | null): Promise<void> {
    if (!user) {
      logger.info('[Redirect] No user session, redirecting to /auth.');
      this.navigate('/auth?returnTo=/dashboard', { replace: true });
      return;
    }

    try {
      const isAdmin = await this.isAdminCheck();
      const targetRoute = this.determineRoute(isAdmin);
      logger.info(`[Redirect] User ${user.uid} is an admin: ${isAdmin}. Redirecting to ${targetRoute}.`);
      this.navigate(targetRoute, { replace: true });
    } catch (error) {
      logger.error('[Redirect] Error during role check, falling back to client dashboard.', { error });
      this.navigateToClientDashboard();
    }
  }

  private async isAdminCheck(): Promise<boolean> {
    const result = await checkAdminRole();
    return result.data?.is_admin === true;
  }

  private determineRoute(isAdmin: boolean): string {
    if (isAdmin) {
      return '/admin';
    }
    return this.getClientDashboardPath();
  }

  private getClientDashboardPath(): string {
    // This allows users to override their device preference, e.g., for testing mobile view on desktop.
    try {
      const devicePreference = localStorage.getItem('zg.devicePreference');
      if (devicePreference === 'mobile') return '/pwa/dashboard';
      if (devicePreference === 'desktop') return '/me';
    } catch (e) {
      logger.warn('[Redirect] Could not access localStorage.', { error: e });
    }
    
    // Default to device detection if no preference is set.
    return isMobileDevice() ? '/pwa/dashboard' : '/me';
  }

  private navigateToClientDashboard(): void {
    const fallbackRoute = this.getClientDashboardPath();
    this.navigate(fallbackRoute, { replace: true });
  }
}

// --- Main Component ---

export default function DashboardRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectManager = new RedirectManager(navigate);
    const unsubscribe = onAuthStateChanged(auth, user => {
      redirectManager.handleUser(user);
    });

    // Cleanup subscription on component unmount.
    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
