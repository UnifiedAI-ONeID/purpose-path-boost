import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('authorization');
    const { isAdmin } = await requireAdmin(authHeader);
    
    if (!isAdmin) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
    }

    const body = await req.json();
    
    if (!body.email && !body.id) {
      return jsonResponse({ ok: false, error: 'Email or ID required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    body.updated_at = new Date().toISOString();

    if (body.id) {
      const { error } = await supabase
        .from('leads')
        .update(body)
        .eq('id', body.id);
      
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('leads')
        .insert([body]);
      
      if (error) throw error;
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error('[admin-leads-upsert] Error:', error);
    return jsonResponse({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Internal error' 
    }, 500);
  }
});
