import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const body = await req.json();
    const { profile_id, lesson_slug } = body || {};

    if (!profile_id || !lesson_slug) {
      return new Response(
        JSON.stringify({ ok: false, error: 'missing parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: plan } = await supabase
      .from('v_profile_plan')
      .select('*')
      .eq('profile_id', profile_id)
      .maybeSingle();

    const start = plan?.period_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const { data: existing } = await supabase
      .from('lesson_events')
      .select('id')
      .eq('profile_id', profile_id)
      .eq('lesson_slug', lesson_slug)
      .gte('created_at', start)
      .limit(1);

    if (existing?.length) {
      return new Response(
        JSON.stringify({ ok: true, counted: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabase.rpc('increment_lesson_usage', {
      p_profile: profile_id,
      p_start: start
    });

    if (error) {
      console.error('Failed to increment usage:', error);
    }

    return new Response(
      JSON.stringify({ ok: true, counted: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('Mark watch error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
