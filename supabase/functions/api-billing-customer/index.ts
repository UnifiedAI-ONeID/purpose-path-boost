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
    const { profile_id, email, name, locale = 'en' } = await req.json();

    if (!profile_id || !email) {
      return new Response(
        JSON.stringify({ ok: false, error: 'missing profile_id or email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if customer already exists
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('airwallex_customer_id')
      .eq('profile_id', profile_id)
      .not('airwallex_customer_id', 'is', null)
      .limit(1);

    let customer_id = existingSub?.[0]?.airwallex_customer_id;

    // Create customer if needed
    if (!customer_id) {
      // Generate mock ID (Airwallex integration would go here)
      customer_id = `cus_${crypto.randomUUID()}`;
    }

    return new Response(
      JSON.stringify({ ok: true, customer_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Customer creation error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Failed to create customer' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
