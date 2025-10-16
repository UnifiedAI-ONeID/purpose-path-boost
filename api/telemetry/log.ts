import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).end();
  
  const s = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );
  
  const { device_id, profile_id, event, payload } = req.body || {};
  
  await s.from('zg_events').insert([{
    device_id,
    profile_id,
    event,
    payload
  }]);
  
  res.status(200).json({ ok: true });
};
