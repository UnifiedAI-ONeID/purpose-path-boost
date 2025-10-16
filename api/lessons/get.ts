import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug') || '';

  if (!slug) {
    return new Response(JSON.stringify({ ok: false, error: 'missing slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    return new Response(JSON.stringify({ ok: false, error: 'Lesson not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, lesson: data }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
