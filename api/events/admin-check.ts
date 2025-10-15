import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Middleware-style auth check for admin endpoints
 * Returns true if user is admin, false otherwise
 */
export async function requireAdmin(req: VercelRequest): Promise<{ isAdmin: boolean; user: any }> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAdmin: false, user: null };
  }

  const token = authHeader.replace('Bearer ', '');
  
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify the JWT and get user
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return { isAdmin: false, user: null };
  }

  // Check if user has admin role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single();

  return { isAdmin: !!roleData, user };
}

/**
 * Returns 403 response if not admin
 */
export async function checkAdmin(req: VercelRequest, res: VercelResponse): Promise<boolean> {
  const { isAdmin } = await requireAdmin(req);
  
  if (!isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return false;
  }
  
  return true;
}
