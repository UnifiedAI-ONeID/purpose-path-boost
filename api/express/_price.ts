import { createClient } from '@supabase/supabase-js';

function applyBuffer(cents:number, bps:number){ return Math.round(cents * (1 + bps/10000)); }
function psychRound(cur:string, cents:number, settings:any){
  if(cur==='CNY'){
    const rnd = settings?.cny_rounding || 'yuan';
    if(rnd==='yuan') return Math.round(cents/100)*100;
    if(rnd==='half') return Math.round(cents/50)*50;
  }
  return Math.round(cents/100)*100-1; // .99
}

export async function resolveExpressPrice(supa:any, { offer_slug, target_currency }:{
  offer_slug:string; target_currency:string;
}){
  target_currency = (target_currency||'USD').toUpperCase();

  const { data: settings } = await supa.from('pricing_settings').select('*').maybeSingle();
  const supported = settings?.supported || ['USD'];
  if (!supported.includes(target_currency)) target_currency = supported[0];

  const { data: off } = await supa.from('express_offers').select('*').eq('slug', offer_slug).maybeSingle();
  if (!off || !off.active) throw new Error('Offer unavailable');

  // override?
  const { data: ov } = await supa.from('express_price_overrides')
    .select('*').eq('offer_slug', offer_slug).eq('currency', target_currency).maybeSingle();
  if (ov) {
    const cents = ov.price_cents;
    return { currency: target_currency, display_cents: cents, charge_cents: cents, source:'override' };
  }

  // same currency
  if (target_currency === off.base_currency) {
    const cents = psychRound(off.base_currency, off.base_price_cents, settings);
    return { currency: off.base_currency, display_cents: cents, charge_cents: cents, source:'fx' };
  }

  // FX path
  const { data: fx } = await supa.from('fx_rates').select('*').eq('base', off.base_currency).maybeSingle();
  let rate:number|undefined;
  if (fx?.rates?.[target_currency]) rate = fx.rates[target_currency];

  if (!rate) {
    const cents = psychRound(off.base_currency, off.base_price_cents, settings);
    return { currency: off.base_currency, display_cents: cents, charge_cents: cents, source:'fx-fallback' };
  }

  const raw = Math.round(off.base_price_cents * rate);
  const buff = applyBuffer(raw, settings?.buffer_bps ?? 150);
  const cents = psychRound(target_currency, buff, settings);
  return { currency: target_currency, display_cents: cents, charge_cents: cents, source:'fx' };
}
