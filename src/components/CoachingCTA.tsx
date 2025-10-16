import { useEffect, useState } from 'react';
import { useAvailability } from '@/hooks/useAvailability';
import { Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

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
    discount: number;
  };
}

export default function CoachingCTA({ slug, defaultName = '', defaultEmail = '' }: CoachingCTAProps) {
  const [meta, setMeta] = useState<PricingMeta | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [coupon, setCoupon] = useState('');
  const [promo] = useState(new URLSearchParams(window.location.search).get('promo') || '');
  const [busy, setBusy] = useState(false);
  const { slots, loading } = useAvailability(slug, { days: 14 });

  useEffect(() => {
    const body = {
      slug,
      currency,
      coupon: coupon || undefined,
      promo: promo || undefined
    };

    fetch('/api/coaching/price-with-discount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.amount_cents > 0) {
          setMeta({
            billing: 'paid',
            price: {
              cur: data.currency,
              cents: data.amount_cents,
              discount: data.discount_cents || 0
            }
          });
        } else {
          setMeta({ billing: 'free' });
        }
      })
      .catch(() => setMeta({ billing: 'free' }));
  }, [slug, currency, coupon, promo]);

  async function openBooking() {
    const response = await fetch('/api/coaching/book-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        name: defaultName,
        email: defaultEmail,
        coupon: coupon || undefined,
        promo: promo || undefined
      })
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
          currency,
          coupon: coupon || undefined,
          promo: promo || undefined
        })
      });

      const data = await response.json();
      
      if (data.ok && data.url) {
        window.location.href = data.url;
      } else if (data.ok && data.free) {
        // Free after discount - go straight to booking
        await openBooking();
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
  const discount = meta?.price?.discount || 0;

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

        {/* Action area */}
        {isPaid ? (
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              className="h-10 w-32"
              placeholder="Coupon"
              value={coupon}
              onChange={e => setCoupon(e.target.value.toUpperCase())}
            />
            <select
              className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={currency}
              onChange={e => setCurrency(e.target.value)}
            >
              {['USD', 'CAD', 'EUR', 'GBP', 'HKD', 'SGD', 'CNY'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Button
              variant="cta"
              onClick={handlePayment}
              disabled={busy}
              className="h-10"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing…
                </>
              ) : discount > 0 ? (
                `Pay ${((meta?.price?.cents || 0) / 100).toFixed(2)} ${meta?.price?.cur} (−${(discount / 100).toFixed(2)})`
              ) : (
                `Pay ${((meta?.price?.cents || 0) / 100).toFixed(2)} ${meta?.price?.cur}`
              )}
            </Button>
          </div>
        ) : (
          <Button variant="cta" onClick={openBooking} className="h-10">
            See more times
          </Button>
        )}
      </div>

      {/* Quick slots */}
      {!loading && slots.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
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
                onClick={openBooking}
                className="h-10 px-3 rounded-xl border border-border bg-muted/50 text-sm hover:bg-muted transition-colors"
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}
