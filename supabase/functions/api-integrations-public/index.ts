import { json, sbAnon, corsHeaders } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = sbAnon(req);
  
  const { data } = await supabase
    .from('integration_settings')
    .select('key, value');

  const map: Record<string, any> = {};
  (data || []).forEach((r: any) => {
    map[r.key] = r.value;
  });

  return json({ ok: true, ...map });
});
