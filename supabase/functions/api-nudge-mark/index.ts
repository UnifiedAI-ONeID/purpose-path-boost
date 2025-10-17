import { json, readJson, sbAnon, corsHeaders } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') return new Response(null, { status: 405 });

  const { id } = await readJson(req);
  const s = sbAnon(req);
  
  await s
    .from('nudge_inbox')
    .update({ seen: true })
    .eq('id', id);

  return json({ ok: true });
});
