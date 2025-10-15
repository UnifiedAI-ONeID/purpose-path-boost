import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../events/admin-check';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { isAdmin } = await requireAdmin(req);
    if (!isAdmin) {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }

    // Proxy to the main FX update endpoint
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const response = await fetch(`${protocol}://${host}/api/fx/update`);
    const data = await response.json();
    
    res.status(200).json(data);
  } catch (e: any) {
    console.error('Admin FX update error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
}
