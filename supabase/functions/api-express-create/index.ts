import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { resolveExpressPrice } from '../_shared/event-pricing.ts';

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
    const s = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { name, email, language = 'en', notes = '', currency = 'USD', offer_slug = 'priority-30' } = await req.json();
    
    if (!name || !email) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const price = await resolveExpressPrice(s, { offer_slug, target_currency: currency });

    const { data: order, error: orderErr } = await s.from('express_orders').insert([{
      offer_slug, 
      name, 
      email, 
      language, 
      notes,
      currency: price.currency, 
      amount_cents: price.charge_cents,
      status: 'pending'
    }]).select().maybeSingle();

    if (orderErr || !order) {
      console.error('[api-express-create] Order creation error:', orderErr);
      throw new Error(orderErr?.message || 'Failed to create order');
    }

    const bookingUrl = `${new URL(req.url).origin}/book?express=true&order=${order.id}`;

    return new Response(
      JSON.stringify({ 
        ok: true, 
        url: bookingUrl, 
        currency: price.currency, 
        amount_cents: price.charge_cents,
        order_id: order.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('Express create error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
