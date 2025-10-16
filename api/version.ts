import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ v: 1, updated_at: new Date().toISOString() });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('zg_versions')
      .select('v, updated_at')
      .eq('key', 'content')
      .maybeSingle();

    if (error) {
      console.error('Version fetch error:', error);
      return res.status(200).json({ 
        v: 1, 
        updated_at: new Date().toISOString() 
      });
    }

    return res.status(200).json({
      v: Number(data?.v || 1),
      updated_at: data?.updated_at || new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Version handler error:', error);
    return res.status(200).json({ 
      v: 1, 
      updated_at: new Date().toISOString() 
    });
  }
}
