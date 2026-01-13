/**
 * @file User role hook - Simplified wrapper around useRoleAndPermissions
 * Provides an easy way to access the current user's role.
 */

import { useRoleAndPermissions, type UserRole } from './useRoleAndPermission';

export type { UserRole };

/**
 * Hook to get the current user's role.
 * This is a simplified wrapper around useRoleAndPermissions for cases
 * where you only need the role information.
 * 
 * @returns Object containing role, loading state, and user
 */
export function useUserRole() {
  const { role, loading, user, hasPermission } = useRoleAndPermissions();
  
  return {
    role,
    loading,
    user,
    hasPermission,
    isOwner: role === 'owner',
    isAdmin: role === 'admin' || role === 'owner',
    isCoach: role === 'coach',
    isSales: role === 'sales',
    isFinance: role === 'finance',
    isSupport: role === 'support',
  };
}
