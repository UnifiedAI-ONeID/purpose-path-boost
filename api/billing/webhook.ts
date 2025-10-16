import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // TODO: Verify webhook signature from Airwallex

  const body = await req.json();
  const { event_type, data } = body || {};

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Handle different webhook events
  if (event_type === 'agreement_activated' || event_type === 'payment_succeeded') {
    const { customer_id, agreement_id, profile_id, plan_slug, interval } = data || {};

    if (!profile_id || !plan_slug) {
      return new Response('Invalid webhook data', { status: 400 });
    }

    // Calculate period dates
    const period_start = new Date();
    const period_end = new Date();
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
      airwallex_customer_id: customer_id,
      airwallex_agreement_id: agreement_id
    });
  }

  if (event_type === 'payment_failed') {
    const { agreement_id } = data || {};
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('airwallex_agreement_id', agreement_id);
  }

  if (event_type === 'agreement_canceled') {
    const { agreement_id } = data || {};
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled', renews: false })
      .eq('airwallex_agreement_id', agreement_id);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
