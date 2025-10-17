import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    const { isAdmin } = await requireAdmin(authHeader);
    
    if (!isAdmin) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get published blogs
    const { data: blogs } = await supabase
      .from('blogs')
      .select('slug, updated_at')
      .eq('published', true);

    // Get published lessons
    const { data: lessons } = await supabase
      .from('lessons')
      .select('slug, updated_at')
      .eq('published', true);

    const items = [
      ...(blogs || []).map(x => `/blog/${x.slug}`),
      ...(lessons || []).map(x => `/lesson/${x.slug}`)
    ];

    console.log(`[admin-sitemap-rebuild] Rebuilt sitemap with ${items.length} pages`);

    // Bump content version
    await supabase.rpc('bump_version', { p_key: 'content' });

    return jsonResponse({ ok: true, pages: items.length });
  } catch (error) {
    console.error('[admin-sitemap-rebuild] Error:', error);
    return jsonResponse({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Internal error' 
    }, 500);
  }
});
