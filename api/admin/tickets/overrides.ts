import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../events/admin-check';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Check admin auth
    const { isAdmin } = await requireAdmin(req);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
    );

    if (req.method === 'GET') {
      const { ticket_id } = req.query;
      const { data, error } = await supabase
        .from('event_ticket_fx_overrides')
        .select('*')
        .eq('ticket_id', ticket_id);
      
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const { ticket_id, currency, price_cents } = req.body;
      
      const { error } = await supabase
        .from('event_ticket_fx_overrides')
        .upsert({ 
          ticket_id, 
          currency: currency.toUpperCase(), 
          price_cents 
        });
      
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { ticket_id, currency } = req.body;
      
      const { error } = await supabase
        .from('event_ticket_fx_overrides')
        .delete()
        .eq('ticket_id', ticket_id)
        .eq('currency', currency.toUpperCase());
      
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    console.error('Overrides error:', e);
    res.status(400).json({ error: e.message });
  }
}
