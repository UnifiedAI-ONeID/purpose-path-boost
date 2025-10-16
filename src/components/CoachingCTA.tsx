import { useEffect, useState } from 'react';
import { useAvailability } from '@/hooks/useAvailability';
import { Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { usePrefs } from '@/prefs/PrefsProvider';
import { t } from '@/i18n/dict';
import { triggerHomeAnim } from '@/anim/animator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const { lang } = usePrefs();
  const [meta, setMeta] = useState<PricingMeta | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [coupon, setCoupon] = useState('');
  const [promo] = useState(new URLSearchParams(window.location.search).get('promo') || '');
  const [busy, setBusy] = useState(false);
  const { slots, loading } = useAvailability(slug, { days: 14 });

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.functions.invoke('api-coaching-price-with-discount', {
        body: {
          slug,
          currency,
          coupon: coupon || undefined,
          promo: promo || undefined
        }
      });

      if (!error && data?.ok && data.amount_cents > 0) {
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

  async function openBooking() {
    triggerHomeAnim(600);
    setBusy(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('api-coaching-book-url', {
        body: {
          slug,
          name: defaultName,
          email: defaultEmail,
          campaign: 'coaching-cta'
        }
      });

      if (!error && data?.ok && data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Failed to open booking');
      }
    } finally {
      setTimeout(() => setBusy(false), 700);
    }
  }

  async function handlePayment() {
    triggerHomeAnim(600);
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
      setTimeout(() => setBusy(false), 900);
    }
  }

  const isPaid = meta?.billing === 'paid';
  const discount = meta?.price?.discount || 0;
  const fmt = new Intl.NumberFormat(lang, { 
    style:'currency', 
    currency: meta?.price?.cur || currency 
  });

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
