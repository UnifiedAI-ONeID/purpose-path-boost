import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ ok: false, error: 'Missing Supabase configuration', rows: [] });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(9);

    if (error) {
      console.error('Testimonials fetch error:', error);
      return res.status(200).json({ ok: false, error: error.message, rows: [] });
    }

    return res.status(200).json({ ok: true, rows: data || [] });
  } catch (error: any) {
    console.error('Testimonials handler error:', error);
    return res.status(500).json({ ok: false, error: error.message, rows: [] });
  }
}
