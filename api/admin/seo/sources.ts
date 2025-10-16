import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('seo_watch_sources')
        .select('*')
        .order('label');

      if (error) {
        console.error('Failed to fetch sources:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const { id, enabled } = req.body || {};

      if (!id || typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'Invalid request body' });
      }

      const { error } = await supabase
        .from('seo_watch_sources')
        .update({ enabled })
        .eq('id', id);

      if (error) {
        console.error('Failed to update source:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error handling SEO sources:', error);
    return res.status(500).json({ error: error.message });
  }
}