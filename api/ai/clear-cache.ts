import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearCache } from '../_util/cache';
import { createClient } from '@supabase/supabase-js';

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Verify admin
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }

    clearCache();
    res.status(200).json({ ok: true, message: 'Cache cleared successfully' });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
