import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.json();
  const { profile_id, plan_slug, interval = 'month', coupon } = body || {};

  if (!profile_id || !plan_slug) {
    return new Response(JSON.stringify({ ok: false, error: 'missing parameters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Get plan details
  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('slug', plan_slug)
    .single();

  if (!plan) {
    return new Response(JSON.stringify({ ok: false, error: 'plan not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Calculate price (with coupon if applicable)
  let price_cents = interval === 'month' ? plan.monthly_usd_cents : plan.annual_usd_cents;
  
  if (coupon) {
    const { data: couponData } = await supabase
      .from('subscription_coupons')
      .select('*')
      .eq('code', coupon)
      .single();

    if (couponData?.percent_off && (!couponData.applies_to?.length || couponData.applies_to.includes(plan_slug))) {
      price_cents = Math.round(price_cents * (1 - couponData.percent_off / 100));
    }
  }

  // TODO: Integrate with Airwallex API
  // 1. Create/retrieve customer
  // 2. Create payment agreement
  // 3. Return redirect URL or client_secret

  // For now, return mock response
  const redirect_url = `${process.env.VITE_SUPABASE_URL || 'http://localhost:8080'}/billing/complete?plan=${plan_slug}&interval=${interval}`;

  return new Response(JSON.stringify({
    ok: true,
    redirect_url,
    amount_cents: price_cents,
    currency: 'USD',
    interval
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
