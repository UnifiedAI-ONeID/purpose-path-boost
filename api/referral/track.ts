import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).end();
  
  const s = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );
  
  const { ref_code, type = 'click' } = req.body || {};
  
  if (!ref_code) {
    return res.status(400).json({ ok: false, error: 'ref_code required' });
  }

  const field = type === 'conversion' ? 'conversions' : 'clicks';
  
  const { error } = await s
    .from('zg_referrals')
    .update({ [field]: s.raw(`${field} + 1`) })
    .eq('ref_code', ref_code);

  res.status(200).json({ ok: !error });
};
