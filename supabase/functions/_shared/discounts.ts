/**
 * Generic discount calculation utilities
 * Used for coaching programs, subscriptions, and other products
 */

/**
 * Apply percentage and/or fixed amount discounts to a base price
 * Percentage discount is applied first, then fixed amount
 */
export function applyDiscount({
  baseCents,
  currency,
  percent_off,
  amount_off_cents
}: {
  baseCents: number;
  currency: string;
  percent_off?: number | null;
  amount_off_cents?: number | null;
}): number {
  let discounted = baseCents;
  
  // Apply percentage discount first
  if (percent_off && percent_off > 0) {
    discounted = Math.round(discounted * (100 - Math.min(100, percent_off)) / 100);
  }
  
  // Then apply fixed amount discount
  if (amount_off_cents && amount_off_cents > 0) {
    discounted = Math.max(0, discounted - amount_off_cents);
  }
  
  return discounted;
}

/**
 * Calculate discount amount (how much was saved)
 */
export function calculateDiscountAmount({
  originalCents,
  finalCents
}: {
  originalCents: number;
  finalCents: number;
}): number {
  return Math.max(0, originalCents - finalCents);
}
