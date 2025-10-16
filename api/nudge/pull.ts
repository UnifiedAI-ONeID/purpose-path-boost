import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const profile_id = url.searchParams.get('profile_id') || '';
  
  if (!profile_id) {
    return new Response(JSON.stringify({ ok: false, error: 'missing profile_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const { data } = await supabase
    .from('nudge_inbox')
    .select('*')
    .eq('profile_id', profile_id)
    .eq('seen', false)
    .gte('expire_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(3);

  return new Response(JSON.stringify({ ok: true, rows: data || [] }), {
    status: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
  });
}
