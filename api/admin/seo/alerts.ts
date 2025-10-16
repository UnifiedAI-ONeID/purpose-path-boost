import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const open = req.query.open === '1';
    const all = req.query.all === '1';

    let query = supabase
      .from('seo_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (open && !all) {
      query = query.is('resolved_at', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch alerts:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data || []);
  } catch (error: any) {
    console.error('Error fetching SEO alerts:', error);
    return res.status(500).json({ error: error.message });
  }
}