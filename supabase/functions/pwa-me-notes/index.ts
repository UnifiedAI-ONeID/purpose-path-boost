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
      const session_id = url.searchParams.get('session_id');

      if (!profile_id || !session_id) {
        return jsonResponse({ ok: false, error: 'Missing profile_id or session_id' }, 200);
      }

      const { data, error } = await supabase
        .from('me_notes')
        .select('*')
        .eq('profile_id', profile_id)
        .eq('session_id', session_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[pwa-me-notes] Fetch error:', error);
        return jsonResponse({ ok: false, error: error.message }, 200);
      }

      return jsonResponse({ ok: true, rows: data || [] }, 200);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { profile_id, session_id, body: noteBody } = body;

      if (!profile_id || !session_id || !noteBody) {
        return jsonResponse({ ok: false, error: 'Missing required fields' }, 200);
      }

      const { data, error } = await supabase
        .from('me_notes')
        .insert([{ profile_id, session_id, body: noteBody }])
        .select()
        .maybeSingle();

      if (error) {
        console.error('[pwa-me-notes] Note creation error:', error);
        return jsonResponse({ ok: false, error: error.message }, 200);
      }

      if (!data) {
        return jsonResponse({ ok: false, error: 'Failed to create note' }, 200);
      }

      return jsonResponse({ ok: true, note: data }, 200);
    }

    return jsonResponse({ ok: false, error: 'Method not allowed' }, 200);
  } catch (error) {
    console.error('[pwa-me-notes] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ ok: false, error: message }, 200);
  }
});
