import { json, bad, sbAnon, qs, corsHeaders } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const pid = qs(req).get('profile_id');
  const slug = qs(req).get('lesson_slug');
  
  if (!pid || !slug) return bad();
  
  const s = sbAnon(req);

  // Get user's plan
  const plan = await s
    .from('v_profile_plan')
    .select('*')
    .eq('profile_id', pid)
    .maybeSingle();

  const features: any = plan.data?.features || { videos_per_month: 3, all_access: false };
  const start = plan.data?.period_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  // Get usage
  const usage = await s
    .from('lesson_usage')
    .select('*')
    .eq('profile_id', pid)
    .eq('period_start', start)
    .maybeSingle();

  const used = usage.data?.watch_count || 0;
  const limit = features.all_access ? 999999 : Number(features.videos_per_month || 3);
  const remaining = Math.max(0, limit - used);

  return json({
    ok: true,
    access: remaining > 0 || features.all_access,
    remaining,
    plan_slug: plan.data?.plan_slug || 'free',
    window: {
      start,
      end: plan.data?.period_end
    }
  });
});
