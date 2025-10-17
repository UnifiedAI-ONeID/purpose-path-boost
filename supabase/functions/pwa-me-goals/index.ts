import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    
    if (req.method === 'GET') {
      const profile_id = url.searchParams.get('profile_id');
      
      if (!profile_id) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Missing profile_id' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('me_goals')
        .select('*')
        .eq('profile_id', profile_id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Goals fetch error:', error);
        return new Response(
          JSON.stringify({ ok: false, error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({ ok: true, rows: data || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { profile_id, title, due_date } = body;

      if (!profile_id || !title) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Missing required fields' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('me_goals')
        .insert([{ profile_id, title, due_date }])
        .select()
        .maybeSingle();

      if (error) {
        console.error('[pwa-me-goals] Goal creation error:', error);
        return new Response(
          JSON.stringify({ ok: false, error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      if (!data) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Failed to create goal' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({ ok: true, goal: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'PATCH') {
      const body = await req.json();
      const { id, title, status, progress, due_date } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Missing goal ID' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const updates: any = { updated_at: new Date().toISOString() };
      if (title !== undefined) updates.title = title;
      if (status !== undefined) updates.status = status;
      if (progress !== undefined) updates.progress = progress;
      if (due_date !== undefined) updates.due_date = due_date;

      const { data, error } = await supabase
        .from('me_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('[pwa-me-goals] Goal update error:', error);
        return new Response(
          JSON.stringify({ ok: false, error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      if (!data) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Goal not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      return new Response(
        JSON.stringify({ ok: true, goal: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  } catch (error) {
    console.error('Goals API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
