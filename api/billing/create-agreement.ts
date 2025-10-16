import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const PRICE_ID_MAP: Record<string, Record<string, string>> = {
  starter: { month: 'price_starter_month', year: 'price_starter_year' },
  growth: { month: 'price_growth_month', year: 'price_growth_year' },
  pro: { month: 'price_pro_month', year: 'price_pro_year' }
};

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

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Validate plan
  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('slug', plan_slug)
    .eq('active', true)
    .single();

  if (!plan) {
    return new Response(JSON.stringify({ ok: false, error: 'plan not found or inactive' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Calculate price with coupon
  let price_cents = interval === 'month' ? plan.monthly_usd_cents : plan.annual_usd_cents;
  let percent_off = 0;

  if (coupon) {
    const { data: couponData } = await supabase
      .from('subscription_coupons')
      .select('*')
      .eq('code', coupon)
      .eq('active', true)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (couponData?.percent_off && (!couponData.applies_to?.length || couponData.applies_to.includes(plan_slug))) {
      percent_off = couponData.percent_off;
      price_cents = Math.round(price_cents * (1 - percent_off / 100));
    }
  }

  // Get profile info
  const { data: profile } = await supabase
    .from('zg_profiles')
    .select('email, name, locale')
    .eq('id', profile_id)
    .single();

  if (!profile?.email) {
    return new Response(JSON.stringify({ ok: false, error: 'profile not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Ensure customer exists
  const customerResponse = await fetch(`${SUPABASE_URL}/functions/v1/billing-customer`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({
      profile_id,
      email: profile.email,
      name: profile.name,
      locale: profile.locale || 'en'
    })
  }).catch(() => null);

  const customerData = await customerResponse?.json();
  const customer_id = customerData?.customer_id || `cus_${crypto.randomUUID()}`;

  // Get price ID for Airwallex
  const price_id = PRICE_ID_MAP[plan_slug]?.[interval] || `price_${plan_slug}_${interval}`;

  // TODO: Create Airwallex agreement
  // const { aw } = await import('../../../lib/airwallex');
  // const response = await aw('/api/v1/pa/agreements/create', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     request_id: crypto.randomUUID(),
  //     customer_id,
  //     items: [{ price_id, quantity: 1 }],
  //     discounts: percent_off ? [{ type: 'percentage', percentage: percent_off }] : undefined,
  //     metadata: { profile_id, plan_slug, interval, coupon },
  //     return_url: `${process.env.VITE_PUBLIC_BASE_URL}/pricing/success`,
  //     cancel_url: `${process.env.VITE_PUBLIC_BASE_URL}/pricing/cancel`
  //   })
  // });
  // const agreementData = await response.json();

  // Mock response for development
  const baseUrl = process.env.VITE_PUBLIC_BASE_URL || 'http://localhost:8080';
  const redirect_url = `${baseUrl}/pricing/success?plan=${plan_slug}&interval=${interval}`;

  return new Response(JSON.stringify({
    ok: true,
    redirect_url,
    agreement_id: `agr_${crypto.randomUUID()}`,
    amount_cents: price_cents,
    currency: 'USD',
    interval
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
