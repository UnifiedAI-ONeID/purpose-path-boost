import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { functions } from '@/firebase/config';
import { httpsCallable } from 'firebase/functions';

interface FxAuditTicketProps {
  ticketId: string;
}

interface Quote {
    ok: boolean;
    source: string;
    currency: string;
    display_cents: number;
    steps: {
        base?: { currency: string; cents: number };
        fx_unavailable?: boolean;
        fx?: { via: string; rate: number; raw_cents: number };
        buffer_bps: number;
        buffered_cents: number;
        cny_rounding?: string;
        rounded_cents: number;
        override?: { cents: number };
    };
    rates_meta: Record<string, { updated_at: string }>;
}

const fxInspect = httpsCallable<{ ticketId: string; currency: string }, Quote>(functions, 'api-admin-fx-inspect');

export default function FxAuditTicket({ ticketId }: FxAuditTicketProps) {
  const [currency, setCurrency] = useState('USD');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
        const { data } = await fxInspect({ ticketId, currency });
        setQuote(data);
    } catch (error) {
        console.error(error);
    } finally {
        setBusy(false);
    }
  }, [ticketId, currency]);

  useEffect(() => { 
    if (ticketId) load(); 
  }, [ticketId, currency, load]);

  if (!quote?.ok) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['USD', 'CAD', 'EUR', 'GBP', 'HKD', 'SGD', 'CNY'].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={load} disabled={busy}>
              {busy ? 'Checking…' : 'Recalculate'}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">No data yet.</div>
        </CardContent>
      </Card>
    );
  }

  const steps = quote.steps || {};
  const isOverride = quote.source === 'override';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['USD', 'CAD', 'EUR', 'GBP', 'HKD', 'SGD', 'CNY'].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant={isOverride ? 'default' : 'secondary'}>
              {isOverride ? 'Override' : 'Auto-FX'}
            </Badge>
          </div>
          <div className="text-sm font-medium">
            Final: {quote.currency} {(quote.display_cents / 100).toFixed(2)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground mb-1">Base</div>
            <div className="font-medium">
              {steps.base?.currency} {(steps.base?.cents !== undefined ? steps.base.cents / 100 : 0).toFixed(2)}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground mb-1">FX</div>
            {steps.fx_unavailable ? (
              <div>Unavailable — fell back to base</div>
            ) : (
              <div>
                via: {steps.fx?.via || steps.base?.currency} · rate: {steps.fx?.rate ? steps.fx.rate.toFixed(6) : '1.000000'}
                <br />
                raw: {((steps.fx?.raw_cents || steps.base?.cents || 0) / 100).toFixed(2)}
              </div>
            )}
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground mb-1">Buffer</div>
            <div>
              {((steps.buffer_bps || 0) / 100).toFixed(2)}% → {((steps.buffered_cents || 0) / 100).toFixed(2)}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground mb-1">Rounding</div>
            <div>
              {quote.currency === 'CNY' ? `CNY (${steps.cny_rounding})` : '.99 rule'} → {((steps.rounded_cents || 0) / 100).toFixed(2)}
            </div>
          </div>
        </div>

        {steps.override && (
          <div className="text-xs text-muted-foreground">
            Override set: {quote.currency} {(steps.override.cents / 100).toFixed(2)}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Rates updated: {quote.rates_meta 
            ? Object.entries(quote.rates_meta).map(([b, m]) => 
                `${b}: ${new Date(m.updated_at).toLocaleString()}`
              ).join(' · ') 
            : '—'}
        </div>
      </CardContent>
    </Card>
  );
}
