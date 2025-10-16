import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const profile_id = url.searchParams.get('profile_id') || '';
    const lesson_slug = url.searchParams.get('lesson_slug') || '';

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

    const features: any = plan?.features || { videos_per_month: 3, all_access: false };

    const start = plan?.period_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const end = plan?.period_end || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();

    const { data: usage } = await supabase
      .from('lesson_usage')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('period_start', start)
      .maybeSingle();

    const used = usage?.watch_count || 0;
    const limit = features.all_access ? 999999 : Number(features.videos_per_month || 3);
    const remaining = Math.max(0, limit - used);

    return new Response(
      JSON.stringify({
        ok: true,
        access: remaining > 0 || features.all_access,
        remaining,
        plan_slug: plan?.plan_slug || 'free',
        upsell: features.all_access ? null : {
          recommended: used >= 2 ? 'starter' : null,
          options: ['starter', 'growth', 'pro']
        },
        window: { start, end }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('Can watch error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
