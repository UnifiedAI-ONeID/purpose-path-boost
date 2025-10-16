import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.json();
  const { profile_id, trigger, context = {} } = body || {};
  
  if (!profile_id || !trigger) {
    return new Response(JSON.stringify({ ok: false, error: 'missing fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  async function push(n: {
    kind: string;
    title: string;
    body: string;
    cta_label?: string;
    cta_href?: string;
    ttl_min?: number;
  }) {
    const expire = new Date(Date.now() + (n.ttl_min ?? 1440) * 60 * 1000).toISOString();
    await supabase.from('nudge_inbox').insert([{
      profile_id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      cta_label: n.cta_label,
      cta_href: n.cta_href,
      expire_at: expire,
    }]);
  }

  // Trigger-based nudge rules
  if (trigger === 'watched_2_free') {
    await push({
      kind: 'toast',
      title: 'Unlock your next 30 days',
      body: 'Starter gives you 10 lessons each month + live Q&A.',
      cta_label: 'See plans',
      cta_href: '/pricing',
      ttl_min: 60 * 24,
    });
  }

  if (trigger === 'lesson_completed') {
    await push({
      kind: 'banner',
      title: 'Great work!',
      body: 'Book a 20-min Discovery to apply this lesson.',
      cta_label: 'Book now',
      cta_href: '/coaching',
    });
  }

  if (trigger === 'cart_abandon') {
    await push({
      kind: 'modal',
      title: 'Need a hand deciding?',
      body: 'Try Growth risk-free. Cancel anytime.',
      cta_label: 'Finish upgrade',
      cta_href: '/pricing?highlight=growth',
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
