import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
    );

    // Pull common bases; you can expand if needed
    const bases = ['USD', 'EUR', 'CNY'];
    const updated: string[] = [];
    
    for (const base of bases) {
      const response = await fetch(`https://api.exchangerate.host/latest?base=${base}`);
      const data = await response.json();
      
      if (!data || !data.rates) {
        console.warn(`Failed to fetch rates for ${base}`);
        continue;
      }
      
      const { error } = await supabase
        .from('fx_rates')
        .upsert({ 
          base, 
          rates: data.rates, 
          updated_at: new Date().toISOString() 
        });
      
      if (error) {
        console.error(`Error updating ${base}:`, error);
        continue;
      }
      
      updated.push(base);
    }
    
    res.status(200).json({ ok: true, updated, timestamp: new Date().toISOString() });
  } catch (e: any) {
    console.error('FX update error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
}
