import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { resolveExpressPrice } from './_price';

export default async function handler(req:VercelRequest, res:VercelResponse){
  try{
    if (req.method!=='POST') return res.status(405).json({ ok:false, error:'Method not allowed' });
    const s = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

    const { name, email, language='en', notes='', currency='USD', offer_slug='priority-30' } = req.body || {};
    if (!name || !email) return res.status(400).json({ ok:false, error:'Missing fields' });

    const price = await resolveExpressPrice(s, { offer_slug, target_currency: currency });

    // Create order in database
    const { data: order, error: orderErr } = await s.from('express_orders').insert([{
      offer_slug, name, email, language, notes,
      currency: price.currency, 
      amount_cents: price.charge_cents,
      status: 'pending'
    }]).select().single();

    if (orderErr) throw orderErr;

    // For now, return booking URL (in real implementation, integrate with Airwallex)
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const host = req.headers.host as string;
    const bookingUrl = `${proto}://${host}/book?express=true&order=${order.id}`;

    res.status(200).json({ 
      ok:true, 
      url: bookingUrl, 
      currency: price.currency, 
      amount_cents: price.charge_cents,
      order_id: order.id
    });
  }catch(e:any){ 
    res.status(500).json({ ok:false, error:e.message }); 
  }
}
