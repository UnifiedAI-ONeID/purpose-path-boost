import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function validEmail(s:string){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s||''); }

export default async function handler(req:VercelRequest, res:VercelResponse){
  try{
    if (req.method!=='POST') return res.status(405).json({ ok:false, error:'Method not allowed' });

    const b = req.body || {};
    if (b.honey) return res.status(200).json({ ok:true }); // spam bot
    if (!b.consent) return res.status(400).json({ ok:false, error:'consent_required' });
    if (!validEmail(b.email)) return res.status(400).json({ ok:false, error:'bad_email' });
    if (!b.name || !b.message) return res.status(400).json({ ok:false, error:'missing_fields' });

    const supa = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

    // Insert into leads table
    const lead = {
      name: b.name,
      email: b.email,
      wechat: b.wechat||null,
      language: b.lang_pref||'en',
      source: b.source || 'contact_page',
      stage: 'new',
      notes: `Topic: ${b.topic||'n/a'}\nBudget: ${b.budget||'n/a'}\nChannel: ${b.channel_pref||'email'}\nPhone: ${b.phone||'n/a'}\nWhatsApp: ${b.whatsapp||'n/a'}\n\n${b.message||''}`
    };
    const { error } = await supa.from('leads').insert([lead]);
    if (error) throw error;

    res.status(200).json({ ok:true });
  }catch(e:any){
    res.status(500).json({ ok:false, error:e.message });
  }
}
