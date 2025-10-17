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
    const { isAdmin, user } = await requireAdmin(authHeader);
    
    if (!isAdmin || !user) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
    }

    const { id, note } = await req.json();
    
    if (!id || !note) {
      return jsonResponse({ ok: false, error: 'Lead ID and note required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get current notes
    const { data: lead } = await supabase
      .from('leads')
      .select('notes')
      .eq('id', id)
      .single();

    const currentNotes = lead?.notes || [];
    const newNote = {
      text: note,
      created_at: new Date().toISOString(),
      created_by: user.id
    };

    const { error } = await supabase
      .from('leads')
      .update({ 
        notes: [...currentNotes, newNote],
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) throw error;

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error('[admin-leads-note] Error:', error);
    return jsonResponse({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Internal error' 
    }, 500);
  }
});
