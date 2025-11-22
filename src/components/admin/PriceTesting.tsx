import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/db';

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
      const { data } = await supabase.functions.invoke('api-admin-pricing-suggest', {
        body: { 
          ticketId, 
          region: country 
        }
      });
      if (data?.ok) {
        setSuggestion(data.suggestions?.[0]);
        setNote('');
      } else {
        toast.error(data?.error || 'Failed to get suggestions');
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
      const { data } = await supabase.functions.invoke('api-admin-pricing-apply-suggestion', {
        body: {
          ticketId,
          currency: suggestion.currency,
          priceCents: suggestion.price_cents
        }
      });
      
      if (data?.ok) {
        toast.success('Applied pricing suggestion');
        setNote(`Applied ${suggestion.currency} ${(suggestion.price_cents / 100).toFixed(2)}`);
      } else {
        toast.error(data?.error || 'Failed to apply suggestion');
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
      const { data } = await supabase.functions.invoke('api-admin-pricing-adopt-winner', {
        body: { 
          testId: suggestion?.id,
          winningVariant: suggestion?.variant
        }
      });
      
      if (data?.ok) {
        toast.success('Adopted winning variant');
        setNote(`Winner adopted: ${suggestion.currency} ${(suggestion.price_cents / 100).toFixed(2)}`);
      } else {
        toast.error(data?.error || 'Failed to adopt winner');
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
