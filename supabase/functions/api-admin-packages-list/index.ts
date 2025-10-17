import { corsHeaders } from '../_shared/admin-auth.ts';
import { json, sbSrv } from '../_shared/utils.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('authorization');
  const { isAdmin } = await requireAdmin(authHeader);
  
  if (!isAdmin) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  }

  const supabase = sbSrv();
  const { data: pkgs, error } = await supabase
    .from('lesson_packages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[admin-packages-list] Error:', error);
    return json({ ok: false, error: error.message }, 500);
  }

  // Get lesson counts for each package
  const ids = (pkgs || []).map(p => p.id);
  const counts: Record<string, number> = {};

  if (ids.length > 0) {
    const { data: lessonCounts } = await supabase
      .from('package_lessons')
      .select('package_id')
      .in('package_id', ids);

    for (const row of lessonCounts || []) {
      counts[row.package_id] = (counts[row.package_id] || 0) + 1;
    }
  }

  const result = (pkgs || []).map(p => ({
    ...p,
    lesson_count: counts[p.id] || 0
  }));

  return json({ ok: true, rows: result });
});
