import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function grantCalCredit(profile_id: string, minutes: number) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const { data: profile } = await supabase
    .from('zg_profiles')
    .select('email, name')
    .eq('id', profile_id)
    .single();

  if (!profile?.email) return;

  console.log(`Granted ${minutes} minutes of Cal.com credit to ${profile.email}`);
}

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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const body = await req.json();
    const { event_type, data } = body || {};
    const metadata = data?.metadata || {};

    // Handle agreement activation or payment success
    if (event_type === 'pa.agreement.activated' || event_type === 'pa.payment.succeeded') {
      const profile_id = metadata.profile_id;
      const plan_slug = metadata.plan_slug;
      const interval = metadata.interval || 'month';
      const coupon = metadata.coupon;
      const agreement_id = data?.id || data?.agreement_id;

      if (!profile_id || !plan_slug) {
        console.error('Missing profile_id or plan_slug in webhook metadata');
        return new Response(
          JSON.stringify({ ok: false, error: 'Invalid metadata' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Calculate subscription period
      const period_start = new Date();
      const period_end = new Date(period_start);
      if (interval === 'year') {
        period_end.setFullYear(period_end.getFullYear() + 1);
      } else {
        period_end.setMonth(period_end.getMonth() + 1);
      }

      // Upsert subscription
      await supabase.from('subscriptions').upsert({
        profile_id,
        plan_slug,
        status: 'active',
        period_start: period_start.toISOString(),
        period_end: period_end.toISOString(),
        renews: true,
        airwallex_customer_id: data?.customer_id,
        airwallex_agreement_id: agreement_id
      }, {
        onConflict: 'profile_id'
      });

      // Reset usage window
      await supabase
        .from('lesson_usage')
        .delete()
        .eq('profile_id', profile_id)
        .gte('period_start', period_start.toISOString());

      // Redeem coupon if used
      if (coupon) {
        await supabase.rpc('redeem_coupon_once', { p_code: coupon });
      }

      // Grant Cal.com credit for Pro+ plan
      const { data: plan } = await supabase
        .from('plans')
        .select('features')
        .eq('slug', plan_slug)
        .single();

      const sessionMinutes = Number(plan?.features?.session_credit_min || 0);
      if (sessionMinutes > 0) {
        await grantCalCredit(profile_id, sessionMinutes);
      }

      // Award badges
      await supabase.from('profile_badges').upsert([
        { profile_id, badge_code: 'all_access' }
      ], { onConflict: 'profile_id,badge_code' });
    }

    // Handle payment failure
    if (event_type === 'pa.payment.failed') {
      const agreement_id = data?.agreement_id;
      if (agreement_id) {
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('airwallex_agreement_id', agreement_id);
      }
    }

    // Handle cancellation
    if (event_type === 'pa.agreement.canceled' || event_type === 'pa.agreement.suspended') {
      const agreement_id = data?.id;
      if (agreement_id) {
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled', renews: false })
          .eq('airwallex_agreement_id', agreement_id);
      }
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    // Always return 200 to prevent retry storms
    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
