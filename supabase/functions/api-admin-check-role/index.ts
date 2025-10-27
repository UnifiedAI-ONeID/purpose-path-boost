import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[api-admin-check-role] Request received');
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      console.log('[api-admin-check-role] No auth header provided');
      return new Response(
        JSON.stringify({ ok: true, authed: false, is_admin: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create client with service role for bypassing RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );

    const { data: { user }, error } = await (supabase.auth as any).getUser(token);
    
    if (error || !user) {
      console.log('[api-admin-check-role] Auth error or no user:', error?.message);
      return new Response(
        JSON.stringify({ ok: true, authed: false, is_admin: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[api-admin-check-role] User authenticated:', user.id, user.email);

    // Check admin role against zg_admins (single source of truth for policies)
    const { data: adminRow, error: adminErr } = await supabase
      .from('zg_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminErr) {
      console.error('[api-admin-check-role] Admin query error:', adminErr);
    }

    const isAdmin = !!adminRow;
    console.log('[api-admin-check-role] Admin check result:', { 
      userId: user.id, 
      email: user.email, 
      isAdmin, 
      adminRow 
    });


    return new Response(
      JSON.stringify({ 
        ok: true, 
        authed: true, 
        is_admin: isAdmin,
        user: { id: user.id, email: user.email }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[api-admin-check-role] Unexpected error:', error);
    return jsonResponse({ ok: false, authed: false, is_admin: false }, 200);
  }
});
