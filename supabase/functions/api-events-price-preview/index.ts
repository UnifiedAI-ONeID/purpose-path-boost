import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { resolveTicketPrice } from '../_shared/event-pricing.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    
    const { ticket_id, currency } = req.method === 'POST' 
      ? await req.json() 
      : Object.fromEntries(new URL(req.url).searchParams);
    
    if (!ticket_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing ticket_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const price = await resolveTicketPrice(supabase, { 
      ticket_id, 
      target_currency: currency 
    });
    
    return new Response(
      JSON.stringify({ ok: true, ...price }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('Price preview error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
