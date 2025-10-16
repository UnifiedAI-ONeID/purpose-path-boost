import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.json();
  const { profile_id, lesson_slug } = body || {};

  if (!profile_id || !lesson_slug) {
    return new Response(JSON.stringify({ ok: false, error: 'missing parameters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Get active plan to determine period
  const { data: plan } = await supabase
    .from('v_profile_plan')
    .select('*')
    .eq('profile_id', profile_id)
    .maybeSingle();

  const start = plan?.period_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  // Check if this is first time watching this lesson in this period
  const { data: existing } = await supabase
    .from('lesson_events')
    .select('id')
    .eq('profile_id', profile_id)
    .eq('lesson_slug', lesson_slug)
    .gte('created_at', start)
    .limit(1);

  if (existing?.length) {
    return new Response(JSON.stringify({ ok: true, counted: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Increment usage counter
  const { error } = await supabase.rpc('increment_lesson_usage', {
    p_profile: profile_id,
    p_start: start
  });

  if (error) {
    console.error('Failed to increment usage:', error);
  }

  return new Response(JSON.stringify({ ok: true, counted: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
