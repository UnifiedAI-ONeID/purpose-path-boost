import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { checkAdmin } from '../events/admin-check';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Require admin authentication
  if (!(await checkAdmin(req, res))) {
    return;
  }

  try {
    const { type, id, start, end } = req.body || {};

    if (!type || !id || !start) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
    );

    if (type === 'event') {
      const { error } = await supabase
        .from('events')
        .update({ start_at: start, end_at: end || start })
        .eq('id', id);

      if (error) throw error;
    } else if (type === 'post') {
      const { error } = await supabase
        .from('blog_posts')
        .update({ published_at: start })
        .eq('id', id);

      if (error) throw error;
    } else if (type === 'social') {
      const { error } = await supabase
        .from('social_posts')
        .update({ scheduled_at: start })
        .eq('id', id);

      if (error) throw error;
    } else {
      return res.status(400).json({ ok: false, error: 'Invalid type' });
    }

    res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('Calendar update error:', e);
    res.status(400).json({ ok: false, error: e.message });
  }
}
