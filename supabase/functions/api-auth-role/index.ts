import { json, bad, sbSrv, corsHeaders } from '../_shared/utils.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!auth) return bad('NO_TOKEN', 401);

  // Verify JWT and get user
  const sUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: { fetch },
      auth: { persistSession: false, detectSessionInUrl: false }
    }
  );

  const { data: u } = await (sUser.auth as any).getUser(auth);
  if (!u?.user) return json({ ok: true, authed: false });

  const s = sbSrv();
  const { data: adminRow } = await s
    .from('zg_admins')
    .select('user_id')
    .eq('user_id', u.user.id)
    .maybeSingle();

  return json({
    ok: true,
    authed: true,
    is_admin: !!adminRow
  });
});
