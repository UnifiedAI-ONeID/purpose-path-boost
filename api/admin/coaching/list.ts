import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // TODO: admin auth check
  const s = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
  );
  
  const { data, error } = await s
    .from('coaching_offers')
    .select('*')
    .order('sort', { ascending: true });
    
  if (error) {
    return res.status(200).json({ ok: false, error: error.message });
  }
  
  res.status(200).json({ ok: true, rows: data || [] });
}
