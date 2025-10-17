import { json, readJson, sbSrv, bad } from '../_shared/utils.ts';
import { requireAdmin, corsHeaders } from '../_shared/admin-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(null, { status: 405 });
  }

  const authHeader = req.headers.get('authorization');
  const { isAdmin } = await requireAdmin(authHeader);
  
  if (!isAdmin) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  }

  const { key, value } = await readJson(req);
  
  if (!key || typeof value !== 'object') {
    return bad('Invalid key or value');
  }

  const supabase = sbSrv();
  
  await supabase
    .from('integration_settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString()
    });

  return json({ ok: true });
});
