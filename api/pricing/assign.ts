import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );
    
    const { ticket_id, country } = (req.method === 'POST' ? req.body : req.query) as any;
    const visitorId = (req.headers['x-forwarded-for'] as string) || crypto.randomUUID();

    // Find active tests for this ticket & country
    const { data: tests } = await supabase
      .from('event_price_tests')
      .select('*')
      .eq('ticket_id', ticket_id)
      .eq('region', country)
      .eq('is_active', true);

    if (!tests?.length) {
      return res.status(200).json({ ok: false, reason: 'NO_TEST' });
    }

    // Random variant selection
    const selectedTest = tests[Math.floor(Math.random() * tests.length)];
    
    // Record assignment
    await supabase.from('event_price_assignments').insert([{
      test_id: selectedTest.id,
      visitor_id: visitorId,
      country,
      variant: selectedTest.variant,
      price_cents: selectedTest.price_cents,
      currency: selectedTest.currency
    }]);

    res.status(200).json({ 
      ok: true, 
      variant: selectedTest.variant, 
      price_cents: selectedTest.price_cents, 
      currency: selectedTest.currency 
    });
  } catch (e: any) {
    console.error('Price assignment error:', e);
    res.status(400).json({ ok: false, error: e.message });
  }
}
