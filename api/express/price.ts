import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { resolveExpressPrice } from './_price';

export default async (req:VercelRequest, res:VercelResponse)=>{
  try{
    const s = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
    const { currency='USD', offer_slug='priority-30' } = (req.method==='POST'?req.body:req.query) as any;
    const p = await resolveExpressPrice(s, { offer_slug, target_currency: currency });
    res.status(200).json({ ok:true, currency: p.currency, amount_cents: p.display_cents });
  }catch(e:any){
    res.status(500).json({ ok:false, error:e.message });
  }
};
