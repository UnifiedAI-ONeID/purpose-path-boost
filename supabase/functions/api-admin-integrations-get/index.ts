import { json, sbSrv } from '../_shared/utils.ts';
import { requireAdmin, corsHeaders } from '../_shared/admin-auth.ts';

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
  
  const { data: settings } = await supabase
    .from('integration_settings')
    .select('key, value, updated_at');
    
  const { data: secrets } = await supabase
    .from('integration_secrets')
    .select('key, updated_at');

  return json({
    ok: true,
    settings: settings || [],
    secrets: (secrets || []).map(s => ({
      key: s.key,
      updated_at: s.updated_at
    }))
  });
});
