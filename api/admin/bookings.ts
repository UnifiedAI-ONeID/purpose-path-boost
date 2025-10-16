import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // TODO: add your auth check (admin JWT) here and reject non-admins
  const s = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
  
  const { data, error } = await s
    .from('cal_bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
    
  if (error) {
    return res.status(200).json({ ok: false, error: error.message, rows: [] });
  }
  
  res.status(200).json({ ok: true, rows: data || [] });
}
