import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';

interface LeadUpdateRequest {
  id: string;
  stage?: string;
  tags?: string[];
  notes?: string;
  booking_goal?: string;
  booking_challenge?: string;
  booking_timeline?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get('authorization');
    const { isAdmin, user } = await requireAdmin(authHeader);
    
    if (!isAdmin || !user) {
      return jsonResponse({ 
        ok: false, 
        error: 'Unauthorized: Admin access required' 
      }, 403);
    }

    const { id, ...updates }: LeadUpdateRequest = await req.json();

    if (!id) {
      return jsonResponse({ 
        ok: false, 
        error: 'Lead ID is required' 
      }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Update lead
    const { data: lead, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[api-admin-leads-update] Update error:', error);
      return jsonResponse({ 
        ok: false, 
        error: 'Failed to update lead' 
      }, 500);
    }

    console.log('[api-admin-leads-update] Lead updated:', id);

    return jsonResponse({
      ok: true,
      lead
    }, 200);

  } catch (error) {
    console.error('[api-admin-leads-update] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
