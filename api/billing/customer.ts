import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.json();
  const { profile_id, email, name, locale = 'en' } = body || {};

  if (!profile_id || !email) {
    return new Response(JSON.stringify({ ok: false, error: 'missing profile_id or email' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
    try {
      // TODO: Call Airwallex API to create customer
      // For now, generate a mock ID
      customer_id = `cus_${crypto.randomUUID()}`;

      // In production, you would:
      // const { aw } = await import('../../../lib/airwallex');
      // const response = await aw('/api/v1/customers/create', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     request_id: crypto.randomUUID(),
      //     merchant_customer_id: profile_id,
      //     email,
      //     name,
      //     metadata: { profile_id, locale }
      //   })
      // });
      // const data = await response.json();
      // customer_id = data.id;
    } catch (error) {
      console.error('Failed to create Airwallex customer:', error);
      return new Response(JSON.stringify({ ok: false, error: 'Failed to create customer' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, customer_id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
