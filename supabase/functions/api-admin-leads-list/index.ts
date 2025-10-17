import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';

interface LeadsListRequest {
  page?: number;
  limit?: number;
  stage?: string;
  source?: string;
  search?: string;
  sortBy?: 'created_at' | 'name' | 'clarity_score' | 'quiz_score';
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
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

    const params: LeadsListRequest = req.method === 'POST' 
      ? await req.json()
      : Object.fromEntries(new URL(req.url).searchParams);

    const page = parseInt(params.page?.toString() || '1');
    const limit = Math.min(parseInt(params.limit?.toString() || '50'), 100);
    const offset = (page - 1) * limit;
    const sortBy = params.sortBy || 'created_at';
    const sortOrder = params.sortOrder || 'desc';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Build query
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' });

    // Apply filters
    if (params.stage) {
      query = query.eq('stage', params.stage);
    }

    if (params.source) {
      query = query.eq('source', params.source);
    }

    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%,wechat.ilike.%${params.search}%`);
    }

    if (params.dateFrom) {
      query = query.gte('created_at', params.dateFrom);
    }

    if (params.dateTo) {
      query = query.lte('created_at', params.dateTo);
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: leads, error, count } = await query;

    if (error) {
      console.error('[api-admin-leads-list] Query error:', error);
      return jsonResponse({ 
        ok: false, 
        error: 'Failed to fetch leads' 
      }, 500);
    }

    return jsonResponse({
      ok: true,
      leads: leads || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }, 200);

  } catch (error) {
    console.error('[api-admin-leads-list] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
