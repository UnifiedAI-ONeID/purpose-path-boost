import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

/**
 * Shared admin authentication helper for Edge Functions
 * Validates JWT and checks admin role
 */
export async function requireAdmin(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAdmin: false, user: null };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { global: { fetch } }
  );

  const { data: { user }, error } = await (supabase.auth as any).getUser(token);
  
  if (error || !user) {
    return { isAdmin: false, user: null };
  }

  const { data: adminRow, error: adminErr } = await supabase
    .from('zg_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (adminErr) {
    console.error('[requireAdmin] Admin query error:', adminErr);
  }

  return { isAdmin: !!adminRow, user };
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
