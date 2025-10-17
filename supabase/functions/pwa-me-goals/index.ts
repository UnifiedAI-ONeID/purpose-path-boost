import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

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
        return jsonResponse({ ok: false, error: 'Missing profile_id' }, 200);
      }

      const { data, error } = await supabase
        .from('me_goals')
        .select('*')
        .eq('profile_id', profile_id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[pwa-me-goals] Fetch error:', error);
        return jsonResponse({ ok: false, error: error.message }, 200);
      }

      return jsonResponse({ ok: true, rows: data || [] }, 200);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { profile_id, title, due_date } = body;

      if (!profile_id || !title) {
        return jsonResponse({ ok: false, error: 'Missing required fields' }, 200);
      }

      const { data, error } = await supabase
        .from('me_goals')
        .insert([{ profile_id, title, due_date }])
        .select()
        .maybeSingle();

      if (error) {
        console.error('[pwa-me-goals] Goal creation error:', error);
        return jsonResponse({ ok: false, error: error.message }, 200);
      }

      if (!data) {
        return jsonResponse({ ok: false, error: 'Failed to create goal' }, 200);
      }

      return jsonResponse({ ok: true, goal: data }, 200);
    }

    if (req.method === 'PATCH') {
      const body = await req.json();
      const { id, title, status, progress, due_date } = body;

      if (!id) {
        return jsonResponse({ ok: false, error: 'Missing goal ID' }, 200);
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
        return jsonResponse({ ok: false, error: error.message }, 200);
      }

      if (!data) {
        return jsonResponse({ ok: false, error: 'Goal not found' }, 200);
      }

      return jsonResponse({ ok: true, goal: data }, 200);
    }

    return jsonResponse({ ok: false, error: 'Method not allowed' }, 200);
  } catch (error) {
    console.error('[pwa-me-goals] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ ok: false, error: message }, 200);
  }
});
