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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const url = new URL(req.url);
    const device = url.searchParams.get('device');

    if (!device) {
      return new Response(
        JSON.stringify({ error: 'Device ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get profile
    const { data: profile } = await supabase
      .from('zg_profiles')
      .select('id, email, name')
      .eq('device_id', device)
      .maybeSingle();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get next upcoming session (mock for now - connect to bookings later)
    const next = null;

    // Calculate streak percentage (based on recent activity)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: eventCount } = await supabase
      .from('zg_events')
      .select('*', { count: 'exact', head: true })
      .eq('device_id', device)
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Rough streak calculation: 1 event per day = 100%
    const streak_pct = Math.min(100, Math.round((eventCount || 0) / 30 * 100));

    // Generate referral URL
    const baseUrl = req.headers.get('origin') || 'https://zhengrowth.com';
    const ref_url = `${baseUrl}/pwa/home?ref=${device.slice(0, 8)}`;

    return new Response(
      JSON.stringify({
        ok: true,
        next,
        streak_pct,
        ref_url
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in pwa-me-summary:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
