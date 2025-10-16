import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../events/admin-check';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { isAdmin } = await requireAdmin(req);
    if (!isAdmin) {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const row = req.body || {};
    row.code = String(row.code || '').toUpperCase();

    const { error } = await supabase
      .from('coupons')
      .upsert(row, { onConflict: 'code' });

    if (error) {
      return res.status(400).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Save coupon error:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
