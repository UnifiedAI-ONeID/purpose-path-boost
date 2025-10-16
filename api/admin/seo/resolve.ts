import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { id, note } = req.body || {};

    if (!id) {
      return res.status(400).json({ ok: false, error: 'Missing id' });
    }

    const { error } = await supabase
      .from('seo_alerts')
      .update({ 
        resolved_at: new Date().toISOString(),
        resolution_note: note || null
      })
      .eq('id', id);

    if (error) {
      console.error('Failed to resolve alert:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Error resolving SEO alert:', error);
    return res.status(500).json({ error: error.message });
  }
}