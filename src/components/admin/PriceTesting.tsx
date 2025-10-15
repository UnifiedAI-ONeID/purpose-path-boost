import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface PriceTestingProps {
  eventId: string;
  ticketId: string;
  basePrice: number;
  baseCurrency: string;
}

export default function PriceTesting({ eventId, ticketId, basePrice, baseCurrency }: PriceTestingProps) {
  const [suggestion, setSuggestion] = useState<any>(null);
  const [country, setCountry] = useState('CN');
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string>('');

  async function getSuggest() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/pricing/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticket_id: ticketId, 
          base_price_cents: basePrice, 
          base_currency: baseCurrency, 
          country 
        })
      });
      const data = await response.json();
      if (data.ok) {
        setSuggestion(data.heur);
        setNote('');
      } else {
        toast.error(data.error || 'Failed to get suggestions');
      }
    } catch (e: any) {
      toast.error('Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  }

  async function applySuggestion() {
    if (!suggestion) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/pricing/apply-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          ticket_id: ticketId,
          country,
          currency: suggestion.currency,
          suggest_cents: suggestion.suggest_cents,
          spread_pct: 0.10
        })
      });
      const data = await response.json();
      
      if (data.ok) {
        toast.success('Applied pricing suggestion with A/B/C variants');
        setNote(`Applied ${suggestion.currency} ${(suggestion.suggest_cents / 100).toFixed(2)} + seeded A/B/C test variants (-10%, baseline, +10%)`);
      } else {
        toast.error(data.error || 'Failed to apply suggestion');
      }
    } catch (e: any) {
      toast.error('Failed to apply suggestion');
    } finally {
      setLoading(false);
    }
  }

  async function adoptWinner() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/pricing/adopt-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          event_id: eventId, 
          ticket_id: ticketId, 
          country, 
          currency: suggestion?.currency || baseCurrency 
        })
      });
      const data = await response.json();
      
      if (data.ok) {
        const winner = data.winner;
        toast.success(`Adopted winning variant: ${winner.variant}`);
        setNote(`Winner adopted: ${winner.currency} ${(winner.price_cents / 100).toFixed(2)} (variant ${winner.variant}, ${winner.conv_rate_pct}% conversion)`);
      } else {
        toast.error(data.error || 'Failed to adopt winner');
      }
    } catch (e: any) {
      toast.error('Failed to adopt winner');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>A/B Testing & Pricing</CardTitle>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['CN', 'HK', 'TW', 'SG', 'MY', 'CA', 'US'].map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={getSuggest} disabled={loading} variant="outline">
            {loading ? 'Loading...' : 'Get Suggestions'}
          </Button>
        </div>

        {suggestion && (
          <div className="rounded-lg border p-4 space-y-3 bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">AI Suggested Price</div>
                <div className="text-2xl font-bold">
                  {suggestion.currency} {(suggestion.suggest_cents / 100).toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {suggestion.reasoning}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2 border-t">
              <Button onClick={applySuggestion} disabled={loading}>
                Apply & Start A/B Test
              </Button>
              <Button onClick={adoptWinner} disabled={loading} variant="secondary">
                Adopt Winning Variant
              </Button>
            </div>
          </div>
        )}

        {note && (
          <div className="text-sm text-muted-foreground p-3 rounded-lg bg-muted">
            {note}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
