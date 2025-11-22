import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/db';

interface Override {
  id: string;
  ticket_id: string;
  currency: string;
  price_cents: number;
}

interface FxOverridesEditorProps {
  ticketId: string;
}

export default function FxOverridesEditor({ ticketId }: FxOverridesEditorProps) {
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCurrency, setNewCurrency] = useState('CNY');
  const [newPrice, setNewPrice] = useState('');

  async function loadOverrides() {
    try {
      const { data } = await supabase.functions.invoke('api-admin-tickets-overrides', {
        body: { ticketId }
      });
      setOverrides(data?.overrides || []);
    } catch (e) {
      toast.error('Failed to load overrides');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverrides();
  }, [ticketId]);

  async function addOverride() {
    if (!newPrice || parseFloat(newPrice) < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      await supabase.functions.invoke('api-admin-tickets-overrides', {
        body: {
          ticketId,
          currency: newCurrency,
          priceCents: Math.round(parseFloat(newPrice) * 100)
        }
      });

      toast.success(`Added ${newCurrency} override`);
      setNewPrice('');
      loadOverrides();
    } catch (e) {
      toast.error('Failed to add override');
    }
  }

  async function updateOverride(override: Override, newPriceCents: number) {
    try {
      await supabase.functions.invoke('api-admin-tickets-overrides', {
        body: {
          ticketId,
          currency: override.currency,
          priceCents: newPriceCents
        }
      });

      toast.success(`Updated ${override.currency} override`);
      loadOverrides();
    } catch (e) {
      toast.error('Failed to update override');
    }
  }

  async function deleteOverride(currency: string) {
    if (!confirm(`Delete ${currency} override?`)) return;

    try {
      await supabase.functions.invoke('api-admin-tickets-overrides', {
        body: {
          ticketId,
          currency,
          action: 'delete'
        }
      });

      toast.success(`Deleted ${currency} override`);
      loadOverrides();
    } catch (e) {
      toast.error('Failed to delete override');
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Currency Overrides</CardTitle>
        <p className="text-sm text-muted-foreground">
          Set fixed prices for specific currencies (overrides automatic FX conversion)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {overrides.map((override) => (
          <div key={override.currency} className="flex items-center gap-2">
            <div className="w-16 font-medium">{override.currency}</div>
            <Input
              type="number"
              step="0.01"
              defaultValue={(override.price_cents / 100).toFixed(2)}
              onBlur={(e) => {
                const newValue = Math.round(parseFloat(e.target.value) * 100);
                if (newValue !== override.price_cents) {
                  updateOverride(override, newValue);
                }
              }}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteOverride(override.currency)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <select
              className="rounded-md border border-input bg-background px-3 py-2"
              value={newCurrency}
              onChange={(e) => setNewCurrency(e.target.value)}
            >
              {['USD', 'CAD', 'EUR', 'GBP', 'HKD', 'SGD', 'CNY'].map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
            <Input
              type="number"
              step="0.01"
              placeholder="Price"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addOverride}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
