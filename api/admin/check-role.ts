import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization?.replace('Bearer ', '') || '';
  
  if (!authHeader) {
    return res.status(200).json({ ok: true, authed: false, is_admin: false });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(authHeader);
  
  if (error || !user) {
    return res.status(200).json({ ok: true, authed: false, is_admin: false });
  }

  // Check if user is admin using the is_admin function
  const { data: isAdmin, error: adminError } = await supabase
    .rpc('is_admin', { _user_id: user.id })
    .maybeSingle();

  return res.status(200).json({ 
    ok: true, 
    authed: true, 
    is_admin: !!isAdmin,
    user: {
      id: user.id,
      email: user.email
    }
  });
}
