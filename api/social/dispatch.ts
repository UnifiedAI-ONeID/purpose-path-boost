import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPA_URL = process.env.VITE_SUPABASE_URL!;
const SUPA_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Call social-worker edge function which will process due posts
    const workerUrl = `${SUPA_URL}/functions/v1/social-worker`;
    
    const resp = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPA_SERVICE}`
      }
    });

    const result = await resp.json();
    
    return res.status(200).json({
      ok: true,
      dispatched: result.results?.length || 0,
      results: result.results || []
    });
  } catch (e: any) {
    console.error('Dispatch error:', e);
    return res.status(400).json({ error: e.message });
  }
}
