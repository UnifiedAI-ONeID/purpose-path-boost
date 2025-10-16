import { useEffect, useState } from 'react';
import CoachingCTA from './CoachingCTA';
import { usePrefs } from '@/prefs/PrefsProvider';

type Offer = {
  slug: string;
  billing_type: 'free' | 'paid';
  base_currency: string;
  base_price_cents: number;
  cal_event_type_slug: string;
  localized: { title: string; summary: string };
};

export default function CoachingCard({ offer }: { offer: Offer }) {
  const { lang } = usePrefs();
  const [currency, setCurrency] = useState('USD');
  const [price, setPrice] = useState<{ amount_cents: number; currency: string; discount_cents?: number } | null>(null);
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  useEffect(() => {
    (async () => {
      const response = await fetch('/api/coaching/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: offer.slug, currency })
      }).then(r => r.json()).catch(() => null);
      
      if (response?.ok) {
        setPrice({
          amount_cents: response.amount_cents,
          currency: response.currency,
          discount_cents: response.discount_cents
        });
      } else {
        setPrice(null);
      }
    })();
  }, [offer.slug, currency]);

  useEffect(() => {
    (async () => {
      setLoadingSlots(true);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await fetch('/api/coaching/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: offer.slug, tz })
      }).then(r => r.json()).catch(() => null);
      
      setSlots(response?.ok ? (response.slots || []).slice(0, 3) : []);
      setLoadingSlots(false);
    })();
  }, [offer.slug]);

  const formatPrice = (cents: number, curr: string) =>
    new Intl.NumberFormat(lang, { style: 'currency', currency: curr }).format(cents / 100);

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{offer.localized.title}</h3>
          <p className="text-sm text-muted mt-1">{offer.localized.summary}</p>
        </div>
        {offer.billing_type === 'paid' && price && (
          <div className="text-right text-sm">
            <div className="font-medium">{formatPrice(price.amount_cents, price.currency)}</div>
            <select
              className="select mt-1 h-9"
              value={currency}
              onChange={e => setCurrency(e.target.value)}
            >
              {['USD', 'CAD', 'EUR', 'GBP', 'HKD', 'SGD', 'CNY'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {loadingSlots ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl bg-subtle animate-pulse" />
          ))
        ) : slots.length ? (
          slots.map((slot, i) => {
            const date = new Date(slot.start);
            const label = date.toLocaleString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            return (
              <div key={i} className="h-10 px-3 rounded-xl border border-border bg-subtle text-sm flex items-center">
                {label}
              </div>
            );
          })
        ) : (
          <div className="text-sm text-muted sm:col-span-3">
            No upcoming times; click to see full calendar.
          </div>
        )}
      </div>

      <div className="mt-3">
        <CoachingCTA slug={offer.slug} />
      </div>
    </div>
  );
}
