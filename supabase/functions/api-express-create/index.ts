import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { resolveExpressPrice } from '../_shared/event-pricing.ts';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 200);
  }

  try {
    const s = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { name, email, language = 'en', notes = '', currency = 'USD', offer_slug = 'priority-30' } = await req.json();
    
    if (!name || !email) {
      return jsonResponse({ ok: false, error: 'Missing fields' }, 200);
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

    return jsonResponse({ 
      ok: true, 
      url: bookingUrl, 
      currency: price.currency, 
      amount_cents: price.charge_cents,
      order_id: order.id
    }, 200);
  } catch (e: any) {
    console.error('[api-express-create] Error:', e);
    return jsonResponse({ ok: false, error: e.message }, 200);
  }
});
