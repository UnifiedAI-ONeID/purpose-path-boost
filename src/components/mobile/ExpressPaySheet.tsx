import { useEffect, useState } from "react";
import { z } from "zod";
import { invokeApi } from "@/lib/api-client";
import BottomSheet from "./BottomSheet";
import { toast } from "sonner";

const expressPaySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  notes: z.string().trim().max(1000, "Notes too long").optional(),
  currency: z.enum(['USD', 'CAD', 'EUR', 'GBP', 'HKD', 'SGD', 'CNY']),
});

type ExpressPayForm = z.infer<typeof expressPaySchema>;

export default function ExpressPaySheet({ 
  open, 
  onClose, 
  defaultEmail, 
  defaultName 
}: {
  open: boolean;
  onClose: () => void;
  defaultEmail?: string;
  defaultName?: string;
}) {
  const [currency, setCurrency] = useState<'USD' | 'CAD' | 'EUR' | 'GBP' | 'HKD' | 'SGD' | 'CNY'>('USD');
  const [price, setPrice] = useState<{ amount: number; cur: string } | null>(null);
  const [name, setName] = useState(defaultName || '');
  const [email, setEmail] = useState(defaultEmail || '');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ExpressPayForm, string>>>({});

  useEffect(() => {
    if (open) {
      refreshPrice();
    }
  }, [open, currency]);

  async function refreshPrice() {
    try {
      const data = await invokeApi('/api/express/price', {
        body: { currency }
      });
      
      if (data?.ok) {
        setPrice({ amount: data.amount_cents, cur: data.currency });
      }
    } catch (err) {
      console.error('Failed to load price:', err);
      toast.error('Failed to load price');
    }
  }

  async function handlePay() {
    // Clear previous errors
    setErrors({});

    // Validate input
    const formData: ExpressPayForm = {
      name: name.trim(),
      email: email.trim(),
      notes: notes.trim(),
      currency
    };

    const validation = expressPaySchema.safeParse(formData);
    
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof ExpressPayForm, string>> = {};
      validation.error.issues.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof ExpressPayForm] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error('Please fix the errors in the form');
      return;
    }

    setBusy(true);

    try {
      const data = await invokeApi('/api/express/create', {
        body: {
          name: validation.data.name,
          email: validation.data.email,
          language: guessLang(validation.data.email),
          notes: validation.data.notes || '',
          currency: validation.data.currency,
          offer_slug: 'priority-30'
        }
      });

      if (data?.ok && data?.url) {
        // Redirect to payment
        window.location.href = data.url;
      } else {
        throw new Error(data?.error || 'Payment creation failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Unable to start payment. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="⚡ Priority Consult (30 min)">
      <div className="space-y-3">
        {/* Currency & Price */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Currency</label>
            <select 
              className="w-full px-3 py-2 rounded-xl border border-border bg-background"
              value={currency} 
              onChange={e => setCurrency(e.target.value as typeof currency)}
            >
              {['USD', 'CAD', 'EUR', 'GBP', 'HKD', 'SGD', 'CNY'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-border bg-muted/50 p-3 flex flex-col justify-center">
            <div className="text-xs text-muted-foreground">Price</div>
            <div className="text-lg font-semibold">
              {price ? `${price.cur} ${(price.amount / 100).toFixed(2)}` : '—'}
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <input 
            className={`w-full px-3 py-2 rounded-xl border ${errors.name ? 'border-red-500' : 'border-border'} bg-background`}
            placeholder="Your full name" 
            value={name} 
            onChange={e => setName(e.target.value)}
            maxLength={100}
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <input 
            className={`w-full px-3 py-2 rounded-xl border ${errors.email ? 'border-red-500' : 'border-border'} bg-background`}
            type="email"
            placeholder="Email address" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            maxLength={255}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <textarea 
            className={`w-full px-3 py-2 rounded-xl border ${errors.notes ? 'border-red-500' : 'border-border'} bg-background`}
            rows={4} 
            placeholder="What would you like to discuss? (optional)" 
            value={notes} 
            onChange={e => setNotes(e.target.value)}
            maxLength={1000}
          />
          {errors.notes && (
            <p className="text-xs text-red-500 mt-1">{errors.notes}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{notes.length}/1000</p>
        </div>

        {/* Pay Button */}
        <button 
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handlePay} 
          disabled={busy}
        >
          {busy ? 'Processing…' : 'Pay & Get Priority Access'}
        </button>

        {/* Info */}
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Secure payment via Airwallex (Cards, WeChat Pay, Alipay)</li>
          <li>• 100% refund if canceled ≥24h before your slot</li>
          <li>• Priority response within 24 hours</li>
        </ul>
      </div>
    </BottomSheet>
  );
}

function guessLang(email: string): string {
  return /(\.cn|\.tw|\.hk)$/.test(email) ? 'zh-CN' : 'en';
}