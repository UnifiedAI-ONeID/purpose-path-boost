// Coupon validation and discount calculation helpers

interface ValidateParams {
  event_id: string;
  ticket_id: string;
  email: string;
  code: string;
}

interface ValidationResult {
  ok: boolean;
  reason?: string;
  coupon?: any;
}

export async function validateCoupon(
  supabase: any,
  { event_id, ticket_id, email, code }: ValidateParams
): Promise<ValidationResult> {
  if (!code) return { ok: false, reason: 'No code provided' };

  // Fetch coupon
  const { data: coupon, error } = await supabase
    .from('event_coupons')
    .select('*')
    .eq('event_id', event_id)
    .ilike('code', code)
    .single();

  if (error || !coupon) {
    return { ok: false, reason: 'Invalid coupon code' };
  }

  // Check if active
  if (!coupon.active) {
    return { ok: false, reason: 'Coupon is inactive' };
  }

  // Check dates
  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return { ok: false, reason: 'Coupon not yet valid' };
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return { ok: false, reason: 'Coupon expired' };
  }

  // Check max uses
  if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
    return { ok: false, reason: 'Coupon usage limit reached' };
  }

  // Check per-user limit
  if (email && coupon.per_user_limit > 0) {
    const { count } = await supabase
      .from('event_coupon_uses')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)
      .eq('email', email);

    if (count && count >= coupon.per_user_limit) {
      return { ok: false, reason: 'You have already used this coupon' };
    }
  }

  // Check ticket applicability
  if (!coupon.applies_to_all && coupon.tickets?.length > 0) {
    if (!coupon.tickets.includes(ticket_id)) {
      return { ok: false, reason: 'Coupon not valid for this ticket' };
    }
  }

  return { ok: true, coupon };
}

export function applyDiscount({
  price_cents,
  ticket_currency,
  coupon
}: {
  price_cents: number;
  ticket_currency: string;
  coupon: any;
}): { total_cents: number; discount_cents: number; currency: string } {
  let discount_cents = 0;

  if (coupon.discount_type === 'percent') {
    discount_cents = Math.round((price_cents * coupon.discount_value) / 100);
  } else if (coupon.discount_type === 'amount') {
    // Only apply if currencies match
    if (coupon.currency === ticket_currency) {
      discount_cents = Math.min(coupon.discount_value, price_cents);
    }
  }

  const total_cents = Math.max(0, price_cents - discount_cents);

  return {
    total_cents,
    discount_cents,
    currency: ticket_currency
  };
}

export async function recordCouponUse(
  supabase: any,
  {
    coupon_id,
    event_id,
    email,
    reg_id
  }: {
    coupon_id: string;
    event_id: string;
    email: string;
    reg_id: string;
  }
) {
  // Record use
  await supabase.from('event_coupon_uses').insert([
    { coupon_id, event_id, email, reg_id }
  ]);

  // Increment used_count
  await supabase.rpc('increment_coupon_uses', { coupon_uuid: coupon_id });
}
