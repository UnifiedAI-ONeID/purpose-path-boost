import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Check if user is authenticated and is admin
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(200).json({ ok: false, error: 'Not authenticated' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  const s = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
  
  const { data: { user }, error } = await s.auth.getUser(token);
  
  if (error || !user) {
    return res.status(200).json({ ok: false, error: 'Invalid token' });
  }
  
  // TODO: Check if user has admin role in your profiles/roles table
  // For now, just check if user exists
  
  res.status(200).json({ ok: true, user: { id: user.id, email: user.email } });
}
