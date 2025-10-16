import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req:VercelRequest, res:VercelResponse){
  try {
    const s = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
    const range = (req.query.range as string)||'24h';
    const ms = range==='1h'? 3600e3 : range==='7d'? 7*86400e3 : 24*3600e3;
    const since = new Date(Date.now()-ms).toISOString();
    
    const { data } = await s.from('ai_logs')
      .select('*')
      .gte('at', since)
      .order('at', { ascending:false })
      .limit(200);
    
    res.status(200).json({ ok:true, rows: data||[] });
  } catch(e:any) {
    res.status(500).json({ ok:false, error: e.message, rows:[] });
  }
}
