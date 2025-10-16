import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.json();
  const { profile_id, lesson_slug, at_sec, duration_sec, completed } = body || {};

  if (!profile_id || !lesson_slug) {
    return new Response(JSON.stringify({ ok: false, error: 'missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const fields: any = {
    profile_id,
    lesson_slug,
    watched_seconds: at_sec || 0,
    last_position_sec: Math.min(at_sec || 0, duration_sec || at_sec || 0),
    last_watched_at: new Date().toISOString(),
  };

  if (completed) {
    fields.completed = true;
  }

  const { error } = await supabase
    .from('lesson_progress')
    .upsert(fields, { onConflict: 'profile_id,lesson_slug' });

  if (error) {
    console.error('Failed to update progress:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Log completion event
  if (completed) {
    await supabase.from('lesson_events').insert([{
      profile_id,
      lesson_slug,
      ev: 'complete',
      at_sec: at_sec || 0,
    }]);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
