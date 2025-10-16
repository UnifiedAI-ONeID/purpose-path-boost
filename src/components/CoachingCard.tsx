import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CoachingCTA from './CoachingCTA';
import { usePrefs } from '@/prefs/PrefsProvider';
import { invokeApi } from '@/lib/api-client';

type Offer = {
  slug: string;
  billing_type: 'free' | 'paid';
  base_currency: string;
  base_price_cents: number;
  cal_event_type_slug: string;
  title_en?: string;
  summary_en?: string;
  localized?: { title: string; summary: string };
};

export default function CoachingCard({ offer }: { offer: Offer }) {
  const { lang } = usePrefs();
  const [currency, setCurrency] = useState('USD');
  const [price, setPrice] = useState<{ amount_cents: number; currency: string; discount_cents?: number } | null>(null);
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await invokeApi('/api/coaching/price', {
        body: { slug: offer.slug, currency }
      });
      
      if (data?.ok) {
        setPrice({
          amount_cents: data.amount_cents,
          currency: data.currency,
          discount_cents: data.discount_cents
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
      const data = await invokeApi('/api/coaching/availability', {
        body: { slug: offer.slug, tz }
      });
      
      setSlots(data?.ok ? (data.slots || []).slice(0, 3) : []);
      setLoadingSlots(false);
    })();
  }, [offer.slug]);

  const formatPrice = (cents: number, curr: string) =>
    new Intl.NumberFormat(lang, { style: 'currency', currency: curr }).format(cents / 100);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 hover:shadow-lg transition-shadow">
      {/* Title and Summary - clickable to detail page */}
      <Link to={`/coaching/${offer.slug}`} className="block mb-4 group">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-xl font-bold text-card-foreground group-hover:text-primary transition-colors">
            {offer.localized?.title || offer.title_en || 'Coaching Program'}
          </h3>
          {offer.billing_type === 'free' && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              FREE
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
          {offer.localized?.summary || offer.summary_en || 'Professional coaching program'}
        </p>
      </Link>

      {/* Pricing for paid programs */}
      {offer.billing_type === 'paid' && (
        <div className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Investment</div>
              <div className="text-2xl font-bold text-foreground">
                {price ? formatPrice(price.amount_cents, price.currency) : '...'}
              </div>
            </div>
            <select
              className="h-10 px-3 rounded-md border border-input bg-background text-sm font-medium"
              value={currency}
              onChange={e => setCurrency(e.target.value)}
            >
              {['USD', 'CAD', 'EUR', 'GBP', 'HKD', 'SGD', 'CNY'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Upcoming slots preview */}
      <div className="mb-4">
        <div className="text-sm font-medium text-muted-foreground mb-2">
          {loadingSlots ? 'Checking availability...' : 'Upcoming times:'}
        </div>
        <div className="grid grid-cols-1 gap-2">
          {loadingSlots ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-muted animate-pulse" />
            ))
          ) : slots.length ? (
            slots.map((slot, i) => {
              const date = new Date(slot.start);
              const label = date.toLocaleString(lang, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              return (
                <div 
                  key={i} 
                  className="px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm font-medium text-foreground"
                >
                  {label}
                </div>
              );
            })
          ) : (
            <div className="text-sm text-muted-foreground italic">
              Click below to see full calendar
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <CoachingCTA slug={offer.slug} />
    </div>
  );
}
