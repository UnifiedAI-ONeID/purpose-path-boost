import { json, sbAnon, qs, corsHeaders } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const pid = qs(req).get('profile_id');
  if (!pid) return json({ ok: true, rows: [] });

  const s = sbAnon(req);
  
  const { data } = await s
    .from('nudge_inbox')
    .select('*')
    .eq('profile_id', pid)
    .eq('seen', false)
    .gte('expire_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(3);

  return json({ ok: true, rows: data || [] });
});
