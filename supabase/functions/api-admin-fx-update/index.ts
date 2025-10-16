import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { requireAdmin, corsHeaders } from '../_shared/admin-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    const authHeader = req.headers.get('authorization');
    const { isAdmin } = await requireAdmin(authHeader);

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { base, rates } = await req.json();

    if (!base || !rates) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing base or rates' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error } = await supabase
      .from('fx_rates')
      .upsert({ base, rates, updated_at: new Date().toISOString() }, { onConflict: 'base' });

    if (error) {
      console.error('FX update error:', error);
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('FX update error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
