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
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { type, id, start, end } = await req.json();

    if (!type || !id || !start) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (type === 'event') {
      const { error } = await supabase
        .from('events')
        .update({ start_at: start, end_at: end || start })
        .eq('id', id);

      if (error) throw error;
    } else if (type === 'post') {
      const { error } = await supabase
        .from('blog_posts')
        .update({ published_at: start })
        .eq('id', id);

      if (error) throw error;
    } else if (type === 'social') {
      const { error } = await supabase
        .from('social_posts')
        .update({ scheduled_at: start })
        .eq('id', id);

      if (error) throw error;
    } else {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('Calendar update error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
