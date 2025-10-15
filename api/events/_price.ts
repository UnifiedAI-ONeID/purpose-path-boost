import { createClient } from '@supabase/supabase-js';

export type PriceResult = {
  currency: string;
  display_cents: number;  // price shown to user
  charge_cents: number;   // same as display unless you add fees
  source: 'override' | 'fx' | 'base';
};

export async function resolveTicketPrice(
  supabase: any,
  { ticket_id, target_currency }: { ticket_id: string; target_currency?: string }
): Promise<PriceResult> {
  
  target_currency = (target_currency || 'USD').toUpperCase();

  // 1) Load settings & ticket
  const { data: settings } = await supabase
    .from('pricing_settings')
    .select('*')
    .single();
  
  const supported: string[] = settings?.supported || ['USD'];
  if (!supported.includes(target_currency)) {
    target_currency = supported[0]; // fallback
  }

  const { data: ticket, error: ticketError } = await supabase
    .from('event_tickets')
    .select('*')
    .eq('id', ticket_id)
    .single();
  
  if (ticketError || !ticket) throw new Error('Ticket not found');

  const baseCur = (ticket.base_currency || 'USD').toUpperCase();
  const baseCents = ticket.base_price_cents || 0;

  // 2) Check for hard override
  const { data: override } = await supabase
    .from('event_ticket_fx_overrides')
    .select('*')
    .eq('ticket_id', ticket_id)
    .eq('currency', target_currency)
    .maybeSingle();

  if (override) {
    const cents = override.price_cents;
    return { 
      currency: target_currency, 
      display_cents: cents, 
      charge_cents: cents, 
      source: 'override' 
    };
  }

  // 3) Same currency → no FX needed
  if (target_currency === baseCur) {
    const cents = psychRound(baseCur, baseCents, settings);
    return { 
      currency: baseCur, 
      display_cents: cents, 
      charge_cents: cents, 
      source: 'base' 
    };
  }

  // 4) FX conversion path
  const { data: fxData } = await supabase
    .from('fx_rates')
    .select('*')
    .eq('base', baseCur)
    .maybeSingle();

  if (!fxData?.rates?.[target_currency]) {
    // Try USD as pivot if base not present
    const { data: pivotData } = await supabase
      .from('fx_rates')
      .select('*')
      .eq('base', 'USD')
      .maybeSingle();
    
    if (!pivotData?.rates?.[baseCur] || !pivotData?.rates?.[target_currency]) {
      // Last resort: show base currency
      const cents = psychRound(baseCur, baseCents, settings);
      return { 
        currency: baseCur, 
        display_cents: cents, 
        charge_cents: cents, 
        source: 'base' 
      };
    }
    
    const usdToTarget = pivotData.rates[target_currency];
    const usdToBase = pivotData.rates[baseCur];
    const baseToTarget = usdToTarget / usdToBase;
    const raw = Math.max(0, Math.round(baseCents * baseToTarget));
    const buffered = applyBuffer(raw, settings?.buffer_bps ?? 150);
    const cents = psychRound(target_currency, buffered, settings);
    return { 
      currency: target_currency, 
      display_cents: cents, 
      charge_cents: cents, 
      source: 'fx' 
    };
  }
  
  const rate = fxData.rates[target_currency] as number;
  const raw = Math.max(0, Math.round(baseCents * rate));
  const buffered = applyBuffer(raw, settings?.buffer_bps ?? 150);
  const cents = psychRound(target_currency, buffered, settings);
  return { 
    currency: target_currency, 
    display_cents: cents, 
    charge_cents: cents, 
    source: 'fx' 
  };
}

function applyBuffer(cents: number, bps: number): number {
  // bps: 150 -> +1.5%
  return Math.round(cents * (1 + (bps / 10000)));
}

function psychRound(currency: string, cents: number, settings: any): number {
  // Default: *.99 for most currencies; CNY special (yuan or fen99)
  const minor = 100;
  const up = Math.ceil(cents / minor); // round up to next whole
  
  if (currency === 'CNY') {
    if (settings?.cny_rounding === 'fen99') {
      return Math.max(0, (up * minor) - 1); // ¥x.99
    }
    return up * minor; // ¥x.00
  }
  
  // Standard .99 psychological pricing
  const candidate = (up * minor) - 1; // e.g., $19.99
  return Math.max(0, candidate);
}

export async function quoteWithBreakdown(supabase: any, {
  ticket_id, target_currency
}: { ticket_id: string; target_currency?: string }) {
  target_currency = (target_currency || 'USD').toUpperCase();

  const { data: settings } = await supabase.from('pricing_settings').select('*').single();
  const supported: string[] = settings?.supported || ['USD'];
  if (!supported.includes(target_currency)) target_currency = supported[0];

  const { data: t } = await supabase.from('event_tickets').select('*').eq('id', ticket_id).single();
  if (!t) throw new Error('Ticket not found');

  const baseCur = (t.base_currency || 'USD').toUpperCase();
  const baseCents = t.base_price_cents || 0;

  const steps: any = {
    base: { currency: baseCur, cents: baseCents },
    target: target_currency,
    buffer_bps: settings?.buffer_bps ?? 150,
    cny_rounding: settings?.cny_rounding || 'yuan',
    supported
  };

  // Check for override
  const { data: ov } = await supabase
    .from('event_ticket_fx_overrides')
    .select('*').eq('ticket_id', ticket_id).eq('currency', target_currency)
    .maybeSingle();

  if (ov) {
    steps.override = { currency: target_currency, cents: ov.price_cents };
    return {
      source: 'override',
      currency: target_currency,
      display_cents: ov.price_cents,
      charge_cents: ov.price_cents,
      steps
    };
  }

  // Same currency
  if (target_currency === baseCur) {
    const rounded = psychRound(baseCur, baseCents, settings);
    steps.fx = { rate: 1, raw_cents: baseCents };
    steps.buffered_cents = applyBuffer(baseCents, steps.buffer_bps);
    steps.rounded_cents = rounded;
    return { source: 'fx', currency: baseCur, display_cents: rounded, charge_cents: rounded, steps };
  }

  // Find FX rate
  let rate: number | undefined;
  let via: string | undefined;

  const { data: fx } = await supabase.from('fx_rates').select('*').eq('base', baseCur).maybeSingle();
  if (fx?.rates?.[target_currency]) {
    rate = fx.rates[target_currency];
    via = baseCur;
  } else {
    const { data: usd } = await supabase.from('fx_rates').select('*').eq('base', 'USD').maybeSingle();
    if (usd?.rates?.[baseCur] && usd?.rates?.[target_currency]) {
      const usdToTarget = usd.rates[target_currency];
      const usdToBase = usd.rates[baseCur];
      rate = usdToTarget / usdToBase;
      via = 'USD';
      steps.pivot = { base: 'USD', usd_to_target: usdToTarget, usd_to_base: usdToBase };
    }
  }

  if (!rate) {
    const rounded = psychRound(baseCur, baseCents, settings);
    steps.fx_unavailable = true;
    return { source: 'fx', currency: baseCur, display_cents: rounded, charge_cents: rounded, steps };
  }

  const raw = Math.max(0, Math.round(baseCents * rate));
  const buff = applyBuffer(raw, steps.buffer_bps);
  const rnd = psychRound(target_currency, buff, settings);

  steps.fx = { via, rate, raw_cents: raw };
  steps.buffered_cents = buff;
  steps.rounded_cents = rnd;

  return { source: 'fx', currency: target_currency, display_cents: rnd, charge_cents: rnd, steps };
}
