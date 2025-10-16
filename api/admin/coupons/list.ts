import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../events/admin-check';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { isAdmin } = await requireAdmin(req);
    if (!isAdmin) {
      return res.status(403).json({ ok: false, error: 'Admin access required', rows: [] });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
    );

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true, rows: data || [] });
  } catch (error: any) {
    console.error('List coupons error:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
