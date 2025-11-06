import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

/**
 * Shared admin authentication helper for Edge Functions
 * Validates JWT and checks admin role
 */
export async function requireAdmin(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAdmin: false, user: null, role: null };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { global: { fetch } }
  );

  const { data: { user }, error } = await (supabase.auth as any).getUser(token);
  
  if (error || !user) {
    return { isAdmin: false, user: null, role: null };
  }

  // Check new RBAC system first
  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .maybeSingle();

  if (roleRow) {
    return { isAdmin: true, user, role: roleRow.role };
  }

  // Fallback to legacy zg_admins table
  const { data: adminRow } = await supabase
    .from('zg_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  return { isAdmin: !!adminRow, user, role: adminRow ? 'admin' : null };
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
