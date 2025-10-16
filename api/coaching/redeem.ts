import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { slug, email, coupon, amount_cents } = req.body || {};

    if (!slug || !email || !coupon) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const code = String(coupon).toUpperCase();

    // Get coupon details
    const { data: couponData } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (!couponData) {
      return res.status(400).json({ ok: false, error: 'Coupon not found' });
    }

    // Check per-user limit
    if (couponData.per_user_limit) {
      const { count } = await supabase
        .from('coupon_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('coupon_code', code)
        .eq('email', email);

      if ((count || 0) >= couponData.per_user_limit) {
        return res.status(400).json({ ok: false, error: 'Coupon per-user limit reached' });
      }
    }

    // Check max redemptions
    if (couponData.max_redemptions) {
      const { count } = await supabase
        .from('coupon_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('coupon_code', code);

      if ((count || 0) >= couponData.max_redemptions) {
        return res.status(400).json({ ok: false, error: 'Coupon fully redeemed' });
      }
    }

    // Record redemption
    const { error } = await supabase
      .from('coupon_redemptions')
      .insert([{
        coupon_code: code,
        offer_slug: slug,
        email,
        amount_cents: amount_cents ?? 0
      }]);

    if (error) {
      return res.status(400).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Redemption error:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
