import { corsHeaders } from '../_shared/admin-auth.ts';
import { json, readJson, sbSrv, bad } from '../_shared/utils.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(null, { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get('authorization');
  const { isAdmin } = await requireAdmin(authHeader);
  
  if (!isAdmin) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  }

  const body = await readJson(req);
  const {
    slug,
    title,
    monthly_usd_cents,
    annual_usd_cents,
    features,
    active = true,
    price_id_month,
    price_id_year,
    blurb = '',
    faq = []
  } = body || {};

  if (!slug || !title) {
    return bad('Missing required fields: slug, title');
  }

  const supabase = sbSrv();
  const { error } = await supabase
    .from('plans')
    .upsert([{
      slug,
      title,
      monthly_usd_cents,
      annual_usd_cents,
      features,
      active,
      price_id_month: price_id_month || null,
      price_id_year: price_id_year || null,
      blurb: blurb || '',
      faq: faq || []
    }], { onConflict: 'slug' });

  if (error) {
    console.error('[admin-plans-upsert] Error:', error);
    return json({ ok: false, error: error.message }, 500);
  }

  return json({ ok: true });
});
