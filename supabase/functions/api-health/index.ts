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

    const health: any = {
      ok: true,
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // Check Cal.com API key
    const calApiKey = Deno.env.get('CAL_COM_API_KEY');
    health.checks.cal_api_key = {
      configured: !!calApiKey,
      status: calApiKey ? 'ok' : 'missing'
    };

    // Check Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    health.checks.resend_api_key = {
      configured: !!resendApiKey,
      status: resendApiKey ? 'ok' : 'missing',
      note: resendApiKey ? 'Remember to verify your domain at resend.com/domains' : undefined
    };

    // Check Cal.com event types count
    try {
      const { count: eventTypesCount, error: eventTypesError } = await supabase
        .from('cal_event_types')
        .select('*', { count: 'exact', head: true });

      health.checks.cal_event_types = {
        status: eventTypesError ? 'error' : 'ok',
        count: eventTypesCount || 0,
        error: eventTypesError?.message
      };
    } catch (e: any) {
      health.checks.cal_event_types = {
        status: 'error',
        error: e.message
      };
    }

    // Check coaching offers with missing cal_event_type_slug
    try {
      const { data: offersWithoutCal, error: offersError } = await supabase
        .from('coaching_offers')
        .select('slug, cal_event_type_slug')
        .is('cal_event_type_slug', null);

      health.checks.coaching_cal_integration = {
        status: offersError ? 'error' : (offersWithoutCal && offersWithoutCal.length > 0 ? 'warning' : 'ok'),
        missing_cal_slugs: offersWithoutCal?.length || 0,
        offers_without_cal: offersWithoutCal?.map(o => o.slug) || [],
        note: offersWithoutCal && offersWithoutCal.length > 0 
          ? 'Some coaching offers are missing cal_event_type_slug. Run cal-event-types sync or set manually.'
          : undefined,
        error: offersError?.message
      };
    } catch (e: any) {
      health.checks.coaching_cal_integration = {
        status: 'error',
        error: e.message
      };
    }

    // Overall health
    const hasErrors = Object.values(health.checks).some((check: any) => check.status === 'error');
    const hasWarnings = Object.values(health.checks).some((check: any) => check.status === 'warning');
    
    if (hasErrors) {
      health.ok = false;
      health.status = 'unhealthy';
    } else if (hasWarnings) {
      health.status = 'degraded';
    } else {
      health.status = 'healthy';
    }

    return new Response(
      JSON.stringify(health),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[api-health] Error:', error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        status: 'error',
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
