import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/admin-auth.ts';
import { sbSrv } from '../_shared/utils.ts';

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

    const supabase = sbSrv();

    const blogs = await supabase
      .from('blog_posts')
      .select('slug,updated_at')
      .eq('published', true);

    const lessons = await supabase
      .from('lessons')
      .select('slug,updated_at')
      .eq('active', true);

    const events = await supabase
      .from('events')
      .select('slug,created_at')
      .eq('status', 'published');

    const items = [
      ...(blogs.data || []).map(x => `/blog/${x.slug}`),
      ...(lessons.data || []).map(x => `/lessons/${x.slug}`),
      ...(events.data || []).map(x => `/events/${x.slug}`)
    ];

    console.log(`[admin-sitemap-rebuild] Rebuilt sitemap with ${items.length} pages`);

    // Bump content version to invalidate caches
    await supabase.rpc('bump_version_now');

    return jsonResponse({ ok: true, pages: items.length, items });
  } catch (error) {
    console.error('[admin-sitemap-rebuild] Error:', error);
    return jsonResponse({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Internal error' 
    }, 500);
  }
});
