import { useEffect, useState } from 'react';
import { useAvailability } from '@/hooks/useAvailability';
import { Loader2 } from 'lucide-react';

interface CoachingCTAProps {
  slug: string;
  defaultName?: string;
  defaultEmail?: string;
}

interface PricingMeta {
  billing: 'free' | 'paid';
  price?: {
    cur: string;
    cents: number;
  };
}

export default function CoachingCTA({ slug, defaultName = '', defaultEmail = '' }: CoachingCTAProps) {
  const [meta, setMeta] = useState<PricingMeta | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [busy, setBusy] = useState(false);
  const { slots, loading } = useAvailability(slug, { days: 14 });

  useEffect(() => {
    fetch('/api/coaching/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, currency })
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.amount_cents > 0) {
          setMeta({
            billing: 'paid',
            price: { cur: data.currency, cents: data.amount_cents }
          });
        } else {
          setMeta({ billing: 'free' });
        }
      })
      .catch(() => setMeta({ billing: 'free' }));
  }, [slug, currency]);

  async function openBooking() {
    const response = await fetch('/api/coaching/book-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, name: defaultName, email: defaultEmail })
    });
    
    const data = await response.json();
    if (data.ok && data.url) {
      window.open(data.url, '_blank', 'noopener,noreferrer');
    }
  }

  async function handlePayment() {
    setBusy(true);
    
    try {
      const response = await fetch('/api/coaching/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name: defaultName || 'Client',
          email: defaultEmail || '',
          currency
        })
      });

      const data = await response.json();
      
      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Unable to start checkout');
      }
    } catch (error) {
      alert('Payment error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const isPaid = meta?.billing === 'paid';

  return (
    <div className="rounded-2xl border border-border p-4 bg-card">
      {/* Header with action button */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="font-semibold text-card-foreground">
            {isPaid ? 'Priority Session' : 'Free Discovery Call'}
          </div>
          <div className="text-xs text-muted-foreground">
            {loading ? 'Checking availability…' : 'Next available slots from Cal.com'}
          </div>
        </div>

        {isPaid ? (
          <div className="flex items-center gap-2">
            <select
              className="h-10 px-3 rounded-lg border border-border bg-background text-sm"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={busy}
            >
              {['USD', 'CAD', 'EUR', 'GBP', 'HKD', 'SGD', 'CNY'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
              onClick={handlePayment}
              disabled={busy || !meta?.price}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : meta?.price ? (
                `Pay ${(meta.price.cents / 100).toFixed(2)} ${meta.price.cur}`
              ) : (
                'Pay'
              )}
            </button>
          </div>
        ) : (
          <button
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
            onClick={openBooking}
          >
            See more times
          </button>
        )}
      </div>

      {/* Quick slot pills */}
      {slots && slots.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {slots.slice(0, 3).map((slot, i) => {
            const date = new Date(slot.start);
            const label = date.toLocaleString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            return (
              <button
                key={i}
                className="h-10 px-3 rounded-xl border border-border bg-card hover:bg-accent text-sm transition-colors"
                onClick={openBooking}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-10 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}
