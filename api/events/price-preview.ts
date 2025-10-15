import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { resolveTicketPrice } from './_price';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );
    
    const { ticket_id, currency } = (req.method === 'POST' ? req.body : req.query) as any;
    
    if (!ticket_id) {
      return res.status(400).json({ ok: false, error: 'Missing ticket_id' });
    }
    
    const price = await resolveTicketPrice(supabase, { 
      ticket_id, 
      target_currency: currency 
    });
    
    res.status(200).json({ ok: true, ...price });
  } catch (e: any) {
    console.error('Price preview error:', e);
    res.status(400).json({ ok: false, error: e.message });
  }
}
