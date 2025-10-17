import { json, sbAnon, corsHeaders } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const s = sbAnon(req);
  const { data } = await s
    .from('zg_versions')
    .select('v,updated_at')
    .eq('key', 'content')
    .maybeSingle();
  
  return json({
    ok: true,
    v: Number(data?.v || 1),
    updated_at: data?.updated_at
  });
});
