import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { usePrefs } from '@/prefs/PrefsProvider';
import { t } from '@/i18n/dict';
import { triggerHomeAnim } from '@/anim/animator';
import { invokeApi } from '@/lib/api-client';
import { toast } from 'sonner';
import CalBook from './CalBook';

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

interface CheckoutResponse {
  ok: boolean;
  url?: string;
  free?: boolean;
  error?: string;
}

export default function CoachingCTA({ slug, defaultName = '', defaultEmail = '' }: CoachingCTAProps) {
  const { lang } = usePrefs();
  const [meta, setMeta] = useState<PricingMeta | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [coupon, setCoupon] = useState('');
  const [promo] = useState(new URLSearchParams(window.location.search).get('promo') || '');
  const [busy, setBusy] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calSlug, setCalSlug] = useState('');

  useEffect(() => {
    (async () => {
      const data = await invokeApi('/api/coaching/price-with-discount', {
        body: {
          slug,
          currency,
          coupon: coupon || undefined,
          promo: promo || undefined
        }
      });

      if (data?.ok && data.amount_cents > 0) {
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
    })();
  }, [slug, currency, coupon, promo]);

  // Load Cal.com slug for this offer
  useEffect(() => {
    (async () => {
      const response = await fetch(`/api/coaching/get?slug=${slug}`);
      const data = await response.json();
      if (data?.ok && data.cal_event_type_slug) {
        setCalSlug(data.cal_event_type_slug);
      } else if (!data.cal_event_type_slug) {
        // Fallback to discovery call if no specific event type
        setCalSlug('discovery');
      }
    })();
  }, [slug]);

  async function openBooking() {
    triggerHomeAnim(600);
    setBusy(true);
    
    try {
      if (!calSlug) {
        toast.error('Calendar configuration not found');
        return;
      }
      
      setShowCalendar(true);
    } finally {
      setTimeout(() => setBusy(false), 700);
    }
  }

  async function handlePayment() {
    triggerHomeAnim(600);
    setBusy(true);
    
    try {
      const data: CheckoutResponse = await invokeApi('/api/coaching/checkout', {
        body: {
          slug,
          name: defaultName || 'Client',
          email: defaultEmail || '',
          currency,
          coupon: coupon || undefined,
          promo: promo || undefined
        }
      });

      if (data?.ok && data.url) {
        window.location.href = data.url;
      } else if (data?.ok && data.free) {
        // Free after discount - go straight to booking
        await openBooking();
      } else {
        toast.error(data?.error || 'Unable to start checkout');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Payment error. Please try again.');
      } else {
        toast.error('An unknown error occurred during payment.');
      }
    } finally {
      setTimeout(() => setBusy(false), 900);
    }
  }

  const isPaid = meta?.billing === 'paid';
  const discount = meta?.price?.discount || 0;
  const fmt = new Intl.NumberFormat(lang, { 
    style:'currency', 
    currency: meta?.price?.cur || currency 
  });

  // Show embedded calendar
  if (showCalendar && calSlug) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Select Your Time</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCalendar(false)}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Close Calendar
          </Button>
        </div>
        <CalBook 
          slug={calSlug}
          prefill={{
            name: defaultName,
            email: defaultEmail
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* For paid programs: show pricing and payment options */}
      {isPaid ? (
        <div className="space-y-3">
          {discount > 0 && (
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-sm">
              <span className="font-semibold text-primary">
                {fmt.format(discount / 100)} discount applied!
              </span>
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="flex-1 min-w-[120px]"
              placeholder={t(lang, 'coupon') || 'Coupon code'}
              value={coupon}
              onChange={e => setCoupon(e.target.value.toUpperCase())}
            />
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

          <Button
            variant="default"
            size="lg"
            onClick={handlePayment}
            disabled={busy}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold text-base shadow-lg"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t(lang, 'processing') || 'Processing...'}
              </>
            ) : discount > 0 ? (
              <>
                {t(lang,'pay') || 'Pay'} {fmt.format((meta?.price?.cents || 0) / 100)}
                <span className="ml-2 text-xs opacity-80">
                  (saved {fmt.format(discount / 100)})
                </span>
              </>
            ) : (
              <>
                {t(lang,'pay') || 'Pay'} {fmt.format((meta?.price?.cents || 0) / 100)}
              </>
            )}
          </Button>
        </div>
      ) : (
        /* For free programs: simple booking button */
        <Button
          variant="default"
          size="lg"
          onClick={openBooking}
          disabled={busy}
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold text-base shadow-lg"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t(lang, 'loading') || 'Loading...'}
            </>
          ) : (
            <>{t(lang, 'seeTimes') || 'Book Your Free Session'}</>
          )}
        </Button>
      )}
    </div>
  );
}
