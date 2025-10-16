import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

export default async function handler(req: Request) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const { data } = await supabase
    .from('testimonials')
    .select('*')
    .order('featured', { ascending: false })
    .limit(9);

  return new Response(JSON.stringify({ ok: true, rows: data || [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
