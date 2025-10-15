import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PriceTestingProps {
  ticketId: string;
  basePrice: number;
  baseCurrency: string;
}

export default function PriceTesting({ ticketId, basePrice, baseCurrency }: PriceTestingProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [country, setCountry] = useState('CN');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
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
      setSuggestions([data.heur]);
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Market Pricing Suggestions</CardTitle>
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
      <CardContent className="space-y-3">
        <Button onClick={load} disabled={loading}>
          {loading ? 'Loading...' : 'Get Suggestions'}
        </Button>
        {suggestions.map((suggestion, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2">
            <div className="text-sm text-muted-foreground">{suggestion.reasoning}</div>
            <div className="text-lg font-semibold">
              {suggestion.currency} {(suggestion.suggest_cents / 100).toFixed(2)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
