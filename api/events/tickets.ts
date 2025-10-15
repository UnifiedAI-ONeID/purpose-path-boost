import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { event_id } = req.query;

    if (!event_id || typeof event_id !== 'string') {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('event_id', event_id)
      .order('price_cents', { ascending: true });

    if (error) throw error;

    res.status(200).json(data || []);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
