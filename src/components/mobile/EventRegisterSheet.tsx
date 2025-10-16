import { useEffect, useState } from "react";
import BottomSheet from "./BottomSheet";
import { invokeApi } from "@/lib/api-client";

type Props = {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventSlug: string;
  tickets: { id: string; name: string; qty: number; base_currency: string; price_cents: number }[];
  defaultEmail?: string;
};

export default function EventRegisterSheet({ 
  open, 
  onClose, 
  eventId, 
  eventSlug, 
  tickets, 
  defaultEmail 
}: Props) {
  const [ticketId, setTicketId] = useState(tickets[0]?.id || '');
  const [currency, setCurrency] = useState('USD');
  const [email, setEmail] = useState(defaultEmail || '');
  const [name, setName] = useState('');
  const [coupon, setCoupon] = useState('');
  const [price, setPrice] = useState<{ amount: number; cur: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    if (open && ticketId) {
      previewPrice();
    }
  }, [open, ticketId, currency]);

  async function previewPrice() {
    try {
      const data = await invokeApi('/api/events/price-preview', {
        body: { ticket_id: ticketId, currency }
      });
      
      if (data?.ok) {
        setPrice({ amount: data.display_cents, cur: data.currency });
      }
    } catch (err) {
      console.error('Failed to preview price:', err);
    }
  }

  async function applyCoupon() {
    if (!coupon || !email) {
      alert('Enter email and coupon code.');
      return;
    }

    try {
      const data = await invokeApi('/api/events/coupon-preview', {
        body: { event_id: eventId, ticket_id: ticketId, email, code: coupon }
      });
      
      if (data?.ok) {
        setPrice({ amount: data.total_cents, cur: data.currency || currency });
        setMsg(`Coupon applied! Saved ${(data.discount_cents / 100).toFixed(2)}`);
      } else {
        alert(`Invalid code: ${data?.reason || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Failed to apply coupon');
    }
  }

  async function handleRegister() {
    if (!email || !name) {
      alert('Please fill in your name and email.');
      return;
    }

    setBusy(true);
    setMsg('');

    try {
      const data = await invokeApi('/api/events/register', {
        body: {
          event_id: eventId,
          ticket_id: ticketId,
          name,
          email,
          language: guessLang(email),
          currency,
          coupon_code: coupon || undefined
        }
      });

      if (data?.ok && data?.url) {
        // Redirect to payment
        window.location.href = data.url;
      } else if (data?.ok && !data?.url) {
        setMsg('Registered successfully! Check your email for details.');
        setTimeout(onClose, 2000);
      } else {
        throw new Error(data?.error || 'Registration failed');
      }
    } catch (err) {
      alert('Unable to complete registration. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const selectedTicket = tickets.find(t => t.id === ticketId);
  const soldOut = (selectedTicket?.qty || 0) <= 0;

  return (
    <BottomSheet open={open} onClose={onClose} title="Register for Event">
      {/* Ticket Selection */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Ticket Type</label>
            <select 
              className="w-full px-3 py-2 rounded-xl border border-border bg-background"
              value={ticketId} 
              onChange={e => setTicketId(e.target.value)}
            >
              {tickets.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.qty <= 0 ? '(Waitlist)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Currency</label>
            <select 
              className="w-full px-3 py-2 rounded-xl border border-border bg-background"
              value={currency} 
              onChange={e => setCurrency(e.target.value)}
            >
              {['USD', 'CAD', 'EUR', 'GBP', 'HKD', 'SGD', 'CNY'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Price Display */}
        <div className="rounded-xl border border-border bg-muted/50 p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {soldOut ? 'Waitlist Price' : 'Total Price'}
          </span>
          <span className="text-xl font-bold">
            {price ? `${price.cur} ${(price.amount / 100).toFixed(2)}` : '—'}
          </span>
        </div>

        {/* Coupon Code */}
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input 
            className="px-3 py-2 rounded-xl border border-border bg-background"
            placeholder="Coupon code (optional)" 
            value={coupon} 
            onChange={e => setCoupon(e.target.value)}
          />
          <button 
            className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-accent transition"
            onClick={applyCoupon}
          >
            Apply
          </button>
        </div>

        {/* Name & Email */}
        <div className="space-y-2">
          <input 
            className="w-full px-3 py-2 rounded-xl border border-border bg-background"
            placeholder="Your full name" 
            value={name} 
            onChange={e => setName(e.target.value)}
          />
          <input 
            className="w-full px-3 py-2 rounded-xl border border-border bg-background"
            type="email"
            placeholder="Email address" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        {/* Register Button */}
        <button 
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={busy} 
          onClick={handleRegister}
        >
          {busy ? 'Processing…' : soldOut ? 'Join Waitlist' : 'Pay Securely'}
        </button>

        {msg && (
          <div className="text-sm text-center text-muted-foreground bg-muted/50 rounded-xl p-3">
            {msg}
          </div>
        )}

        {/* Payment Info */}
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Secure payment via Airwallex (Cards, WeChat Pay, Alipay)</li>
          <li>• Full refund available up to 24 hours before event</li>
          <li>• Confirmation email sent immediately after payment</li>
        </ul>
      </div>
    </BottomSheet>
  );
}

function guessLang(email: string): string {
  return /(\.cn|\.tw|\.hk)$/.test(email) ? 'zh-CN' : 'en';
}