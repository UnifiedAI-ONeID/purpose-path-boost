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
  const { lesson_slug, funnel_slugs } = body || {};

  if (!lesson_slug || !Array.isArray(funnel_slugs)) {
    return bad('Missing required fields: lesson_slug, funnel_slugs (array)');
  }

  const supabase = sbSrv();

  // Delete existing triggers for this lesson
  await supabase
    .from('lesson_funnel_triggers')
    .delete()
    .eq('lesson_slug', lesson_slug);

  // Insert new triggers
  if (funnel_slugs.length > 0) {
    const rows = funnel_slugs.map((fs: string) => ({
      lesson_slug,
      funnel_slug: fs
    }));

    const { error } = await supabase
      .from('lesson_funnel_triggers')
      .insert(rows);

    if (error) {
      console.error('[admin-funnel-triggers-set] Error:', error);
      return json({ ok: false, error: error.message }, 500);
    }
  }

  return json({ ok: true });
});
