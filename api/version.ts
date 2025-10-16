import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

export default async function handler(_req: Request) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const { data, error } = await supabase
    .from('zg_versions')
    .select('v, updated_at')
    .eq('key', 'content')
    .maybeSingle();

  if (error) {
    return new Response(JSON.stringify({ v: 1, updated_at: new Date().toISOString() }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }

  return new Response(JSON.stringify({
    v: Number(data?.v || 1),
    updated_at: data?.updated_at || new Date().toISOString(),
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
