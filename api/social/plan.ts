import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { buildCaption } from '../../src/lib/captions/templates';
import { pickSchedules } from '../../src/lib/schedule';

const SUPA_URL = process.env.VITE_SUPABASE_URL!;
const SUPA_ANON = process.env.VITE_SUPABASE_ANON_KEY!;
const HOST_BUCKET = process.env.OG_BUCKET || 'social-images';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { 
      slug, 
      title, 
      excerpt = '', 
      tags = [], 
      platforms = ['linkedin', 'facebook', 'instagram', 'x'], 
      lang = 'en', 
      theme = 'light' 
    } = req.body || {};

    if (!slug || !title) {
      return res.status(400).json({ error: 'Missing slug/title' });
    }

    const s = createClient(SUPA_URL, SUPA_ANON, {
      global: { headers: { Authorization: req.headers.authorization || '' } }
    });

    // 1) Ask AI suggester for windows & ideas
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    
    const aiResp = await fetch(`${protocol}://${host}/api/ai/post-suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, title, excerpt, tags })
    });
    
    const ai = await aiResp.json();
    const suggestions = ai.suggestions || {};
    const bestHeadline = suggestions.headlines?.[0]?.en || title;
    const windows = suggestions.when || { 
      'Asia/Shanghai': ['Tue 12:00-14:00', 'Thu 19:00-21:00'], 
      'America/Vancouver': ['Tue 08:00-10:00', 'Wed 12:00-14:00'] 
    };
    
    const schedules = pickSchedules(windows, platforms as any);

    // 2) Render all covers
    await fetch(`${protocol}://${host}/api/og/render-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title: bestHeadline, 
        subtitle: excerpt, 
        slug, 
        theme, 
        lang, 
        tag: tags[0] || 'mindset' 
      })
    });

    // 3) Build platform captions with AI hashtags
    function overrideHashtags(p: string, text: string) {
      const ht = suggestions.hashtags?.[p];
      return ht && ht.length ? `${text}\n${ht.join(' ')}` : text;
    }

    // 4) Resolve media URLs
    function imgFor(p: string) {
      const base = `${SUPA_URL}/storage/v1/object/public/${HOST_BUCKET}/${slug}`;
      if (p === 'instagram') return `${base}/ig_portrait.png`;
      if (p === 'x') return `${base}/x.png`;
      if (p === 'facebook') return `${base}/facebook.png`;
      return `${base}/linkedin.png`;
    }

    // 5) Insert queued social_posts with scheduled_at
    const rows = platforms.map((p: string) => {
      const cap = buildCaption({ 
        platform: p as any, 
        lang: lang as any, 
        title: bestHeadline, 
        summary: excerpt, 
        slug, 
        tags 
      });
      
      const scheduledDate = schedules[p as keyof typeof schedules];
      
      return {
        blog_slug: slug,
        platform: p,
        status: 'queued',
        message: overrideHashtags(p, cap.text),
        media: [{ type: 'image', url: imgFor(p) }],
        tags,
        primary_tag: tags[0] || null,
        scheduled_at: scheduledDate ? scheduledDate.toISOString() : null
      };
    });

    const { error } = await s.from('social_posts').insert(rows);
    if (error) throw error;

    // 6) Return chosen headline & schedule plan
    res.status(200).json({
      ok: true,
      headline: bestHeadline,
      schedules: Object.fromEntries(
        Object.entries(schedules).map(([k, v]) => [k, v ? v.toISOString() : null])
      ),
      source: ai.source || 'heuristic'
    });
  } catch (e: any) {
    console.error('Plan error:', e);
    res.status(400).json({ error: e.message });
  }
}
