import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { requireAdmin, corsHeaders } from '../_shared/admin-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    const { isAdmin } = await requireAdmin(authHeader);

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Admin access required', rows: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const url = new URL(req.url);
    const range = url.searchParams.get('range') || '24h';
    const ms = range === '1h' ? 3600e3 : range === '7d' ? 7 * 86400e3 : 24 * 3600e3;
    const since = new Date(Date.now() - ms).toISOString();

    const s = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    
    const { data } = await s.from('ai_logs')
      .select('*')
      .gte('at', since)
      .order('at', { ascending: false })
      .limit(200);
    
    return new Response(
      JSON.stringify({ ok: true, rows: data || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('AI logs error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: e.message, rows: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
