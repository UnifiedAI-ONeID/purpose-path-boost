import React from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

type Props = {
  children: React.ReactNode;
};

/**
 * ProtectedAdminRoute - Ensures only authenticated admin users can access wrapped routes
 * Redirects non-admin users to auth page
 */
export default function ProtectedAdminRoute({ children }: Props) {
  const isAdmin = useAdminAuth();

  // Show loading state while verifying
  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Non-admins are redirected by useAdminAuth
  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
