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
  const { package_id, lessons } = body || {};

  if (!package_id || !Array.isArray(lessons)) {
    return bad('Missing required fields: package_id, lessons (array)');
  }

  const supabase = sbSrv();

  // Delete existing lessons for this package
  await supabase
    .from('package_lessons')
    .delete()
    .eq('package_id', package_id);

  // Insert new lessons
  if (lessons.length > 0) {
    const rows = lessons.map((l: any) => ({
      package_id,
      lesson_slug: l.slug,
      order_index: l.order_index || 0
    }));

    const { error } = await supabase
      .from('package_lessons')
      .insert(rows);

    if (error) {
      console.error('[admin-package-lessons-set] Error:', error);
      return json({ ok: false, error: error.message }, 500);
    }
  }

  return json({ ok: true });
});
