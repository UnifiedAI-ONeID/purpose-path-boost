import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    const { profile_id, trigger, context = {} } = await req.json();
    
    if (!profile_id || !trigger) {
      return new Response(
        JSON.stringify({ ok: false, error: 'missing fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

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

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Nudge rules error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
