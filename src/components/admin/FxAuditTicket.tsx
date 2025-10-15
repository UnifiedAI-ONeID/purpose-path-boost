import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface FxAuditTicketProps {
  ticketId: string;
}

export default function FxAuditTicket({ ticketId }: FxAuditTicketProps) {
  const [currency, setCurrency] = useState('USD');
  const [quote, setQuote] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    const response = await fetch('/api/admin/fx/inspect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_id: ticketId, currency })
    });
    const data = await response.json();
    setQuote(data);
    setBusy(false);
  }

  useEffect(() => { 
    if (ticketId) load(); 
  }, [ticketId, currency]);

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
              {steps.base?.currency} {(steps.base?.cents / 100).toFixed(2)}
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
                raw: {((steps.fx?.raw_cents || steps.base?.cents) / 100).toFixed(2)}
              </div>
            )}
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground mb-1">Buffer</div>
            <div>
              {(steps.buffer_bps / 100).toFixed(2)}% → {(steps.buffered_cents / 100).toFixed(2)}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground mb-1">Rounding</div>
            <div>
              {quote.currency === 'CNY' ? `CNY (${steps.cny_rounding})` : '.99 rule'} → {(steps.rounded_cents / 100).toFixed(2)}
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
            ? Object.entries(quote.rates_meta).map(([b, m]: any) => 
                `${b}: ${new Date(m.updated_at).toLocaleString()}`
              ).join(' · ') 
            : '—'}
        </div>
      </CardContent>
    </Card>
  );
}
