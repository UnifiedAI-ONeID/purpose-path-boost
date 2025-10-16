import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

export type PriceResult = {
  currency: string;
  display_cents: number;
  charge_cents: number;
  source: 'override' | 'fx' | 'base';
};

export async function resolveTicketPrice(
  supabase: any,
  { ticket_id, target_currency }: { ticket_id: string; target_currency?: string }
): Promise<PriceResult> {
  
  target_currency = (target_currency || 'USD').toUpperCase();

  const { data: settings } = await supabase
    .from('pricing_settings')
    .select('*')
    .maybeSingle();
  
  const supported: string[] = settings?.supported || ['USD'];
  if (!supported.includes(target_currency)) {
    target_currency = supported[0];
  }

  const { data: ticket, error: ticketError } = await supabase
    .from('event_tickets')
    .select('*')
    .eq('id', ticket_id)
    .maybeSingle();
  
  if (ticketError || !ticket) throw new Error('Ticket not found');

  const baseCur = (ticket.base_currency || 'USD').toUpperCase();
  const baseCents = ticket.base_price_cents || 0;

  // Check for hard override
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

  // Same currency → no FX needed
  if (target_currency === baseCur) {
    const cents = psychRound(baseCur, baseCents, settings);
    return { 
      currency: baseCur, 
      display_cents: cents, 
      charge_cents: cents, 
      source: 'base' 
    };
  }

  // FX conversion path
  const { data: fxData } = await supabase
    .from('fx_rates')
    .select('*')
    .eq('base', baseCur)
    .maybeSingle();

  if (!fxData?.rates?.[target_currency]) {
    // Try USD as pivot
    const { data: pivotData } = await supabase
      .from('fx_rates')
      .select('*')
      .eq('base', 'USD')
      .maybeSingle();
    
    if (!pivotData?.rates?.[baseCur] || !pivotData?.rates?.[target_currency]) {
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
  return Math.round(cents * (1 + (bps / 10000)));
}

function psychRound(currency: string, cents: number, settings: any): number {
  const minor = 100;
  const up = Math.ceil(cents / minor);
  
  if (currency === 'CNY') {
    if (settings?.cny_rounding === 'fen99') {
      return Math.max(0, (up * minor) - 1);
    }
    return up * minor;
  }
  
  const candidate = (up * minor) - 1;
  return Math.max(0, candidate);
}

export async function resolveExpressPrice(supa: any, { offer_slug, target_currency }: {
  offer_slug: string; target_currency: string;
}) {
  target_currency = (target_currency || 'USD').toUpperCase();

  const { data: settings } = await supa.from('pricing_settings').select('*').maybeSingle();
  const supported = settings?.supported || ['USD'];
  if (!supported.includes(target_currency)) target_currency = supported[0];

  const { data: off } = await supa.from('express_offers').select('*').eq('slug', offer_slug).maybeSingle();
  if (!off || !off.active) throw new Error('Offer unavailable');

  const { data: ov } = await supa.from('express_price_overrides')
    .select('*').eq('offer_slug', offer_slug).eq('currency', target_currency).maybeSingle();
  if (ov) {
    const cents = ov.price_cents;
    return { currency: target_currency, display_cents: cents, charge_cents: cents, source: 'override' };
  }

  if (target_currency === off.base_currency) {
    const cents = psychRound(off.base_currency, off.base_price_cents, settings);
    return { currency: off.base_currency, display_cents: cents, charge_cents: cents, source: 'fx' };
  }

  const { data: fx } = await supa.from('fx_rates').select('*').eq('base', off.base_currency).maybeSingle();
  let rate: number | undefined;
  if (fx?.rates?.[target_currency]) rate = fx.rates[target_currency];

  if (!rate) {
    const cents = psychRound(off.base_currency, off.base_price_cents, settings);
    return { currency: off.base_currency, display_cents: cents, charge_cents: cents, source: 'fx-fallback' };
  }

  const raw = Math.round(off.base_price_cents * rate);
  const buff = applyBuffer(raw, settings?.buffer_bps ?? 150);
  const cents = psychRound(target_currency, buff, settings);
  return { currency: target_currency, display_cents: cents, charge_cents: cents, source: 'fx' };
}
