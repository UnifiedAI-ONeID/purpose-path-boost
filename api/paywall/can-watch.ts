import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const profile_id = url.searchParams.get('profile_id') || '';
  const lesson_slug = url.searchParams.get('lesson_slug') || '';

  if (!profile_id || !lesson_slug) {
    return new Response(JSON.stringify({ ok: false, error: 'missing parameters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Get active plan
  const { data: plan } = await supabase
    .from('v_profile_plan')
    .select('*')
    .eq('profile_id', profile_id)
    .maybeSingle();

  const features: any = plan?.features || { videos_per_month: 3, all_access: false };

  // Determine billing period
  const start = plan?.period_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const end = plan?.period_end || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();

  // Get usage for this period
  const { data: usage } = await supabase
    .from('lesson_usage')
    .select('*')
    .eq('profile_id', profile_id)
    .eq('period_start', start)
    .maybeSingle();

  const used = usage?.watch_count || 0;
  const limit = features.all_access ? 999999 : Number(features.videos_per_month || 3);
  const remaining = Math.max(0, limit - used);

  return new Response(JSON.stringify({
    ok: true,
    access: remaining > 0 || features.all_access,
    remaining,
    plan_slug: plan?.plan_slug || 'free',
    upsell: features.all_access ? null : {
      recommended: used >= 2 ? 'starter' : null,
      options: ['starter', 'growth', 'pro']
    },
    window: { start, end }
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
