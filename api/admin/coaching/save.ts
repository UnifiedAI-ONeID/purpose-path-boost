import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../events/admin-check';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { isAdmin } = await requireAdmin(req);
  if (!isAdmin) {
    return res.status(403).json({ ok: false, error: 'Admin access required' });
  }
  
  const s = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const row = req.body || {};
  const { error } = await s
    .from('coaching_offers')
    .upsert(row, { onConflict: 'slug' });
    
  if (error) {
    return res.status(200).json({ ok: false, error: error.message });
  }
  
  res.status(200).json({ ok: true });
}
