import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req:VercelRequest, res:VercelResponse){
  try{
    const s = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);
    const { payment_intent_id, order_id, status } = (req.method==='POST'?req.body:req.query) as any;
    
    if (!order_id) return res.status(400).json({ ok:false, error:'missing order_id' });

    await s.from('express_orders').update({ 
      status: status || 'paid',
      airwallex_id: payment_intent_id 
    }).eq('id', order_id);
    
    res.status(200).json({ ok:true });
  }catch(e:any){
    res.status(500).json({ ok:false, error:e.message });
  }
}
