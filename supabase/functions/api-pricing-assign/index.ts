import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticket_id, country, visitor_id } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
    
    const { data: tests } = await supabase.from('event_price_tests')
      .select('*').eq('ticket_id', ticket_id).eq('region', country).eq('is_active', true).limit(1);
    
    if (!tests?.length) {
      return new Response(JSON.stringify({ ok: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const variants = tests.map(t => t.variant);
    const chosen = variants[Math.floor(Math.random() * variants.length)];
    const test = tests.find(t => t.variant === chosen)!;
    
    await supabase.from('event_price_assignments').insert([{
      visitor_id, test_id: test.id, variant: chosen, 
      currency: test.currency, price_cents: test.price_cents, country
    }]);

    return new Response(JSON.stringify({ 
      ok: true, price_cents: test.price_cents, currency: test.currency, variant: chosen 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    });
  }
});
