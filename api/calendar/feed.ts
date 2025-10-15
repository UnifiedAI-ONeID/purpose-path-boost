import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const start = (req.query.start as string) || new Date(Date.now() - 14 * 86400000).toISOString();
    const end = (req.query.end as string) || new Date(Date.now() + 45 * 86400000).toISOString();

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch events
    const { data: events } = await supabase
      .from('events')
      .select('id, slug, title, start_at, end_at, status')
      .gte('start_at', start)
      .lte('start_at', end)
      .order('start_at');

    // Fetch blog posts
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('id, slug, title, published_at')
      .gte('published_at', start)
      .lte('published_at', end)
      .order('published_at');

    // Fetch scheduled social posts
    const { data: socialPosts } = await supabase
      .from('social_posts')
      .select('id, platform, blog_slug, scheduled_at, status')
      .neq('status', 'posted')
      .not('scheduled_at', 'is', null)
      .gte('scheduled_at', start)
      .lte('scheduled_at', end)
      .order('scheduled_at');

    // Combine into unified items array
    const items = [
      ...(events || []).map(e => ({
        type: 'event' as const,
        id: e.id,
        title: `📅 ${e.title}`,
        start: e.start_at,
        end: e.end_at,
        url: `/admin/events/${e.slug}`,
        status: e.status
      })),
      ...(posts || []).map(p => ({
        type: 'post' as const,
        id: p.id,
        title: `📰 ${p.title}`,
        start: p.published_at,
        end: p.published_at,
        url: `/blog/${p.slug}`
      })),
      ...(socialPosts || []).map(sp => ({
        type: 'social' as const,
        id: sp.id,
        title: `📱 ${sp.platform} → ${sp.blog_slug}`,
        start: sp.scheduled_at,
        end: sp.scheduled_at,
        url: `/admin`
      }))
    ];

    res.status(200).json({ ok: true, items });
  } catch (e: any) {
    console.error('Calendar feed error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
}
