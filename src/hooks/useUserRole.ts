import { useEffect, useState } from 'react';
import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';

export type UserRole = 'owner' | 'admin' | 'coach' | 'sales' | 'finance' | 'support' | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadRole() {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.session.user.id)
        .single();

      if (!error && data) {
        setRole(data.role as UserRole);
      } else {
        setRole(null);
      }
      setLoading(false);
    }

    loadRole();
  }, []);

  return { role, loading };
}

export function hasPermission(role: UserRole, requiredRoles: UserRole[]): boolean {
  if (!role) return false;
  return requiredRoles.includes(role);
}
