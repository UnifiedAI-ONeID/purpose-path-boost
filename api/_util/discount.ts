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
}) {
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
