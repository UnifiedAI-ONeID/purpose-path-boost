import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { functions } from '@/firebase/config';
import { httpsCallable } from 'firebase/functions';

const getFxRates = httpsCallable(functions, 'api-admin-fx-rates');
const updateFxRates = httpsCallable(functions, 'api-admin-fx-update');

interface FxData {
  settings?: {
    buffer_bps?: number;
    supported?: string[];
    cny_rounding?: string;
  };
  rates?: {
    USD?: { updated_at?: string };
    EUR?: { updated_at?: string };
  };
}

export default function FxAuditGlobal() {
  const [data, setData] = useState<FxData | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() { 
    const result = await getFxRates();
    setData(result.data as FxData);
  }
  
  useEffect(() => { load(); }, []);

  async function refresh() { 
    setBusy(true); 
    await updateFxRates({ base: 'USD', rates: {} }); 
    setBusy(false); 
    load(); 
  }

  if (!data) return null;
  
  const settings = data.settings || {};
  const usd = data.rates?.USD;
  const eur = data.rates?.EUR;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>FX & Pricing Settings</CardTitle>
          <Button 
            variant="outline" 
            onClick={refresh} 
            disabled={busy}
          >
            {busy ? 'Refreshing…' : 'Refresh FX now'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border">
            <div className="text-sm text-muted-foreground">Buffer (bps)</div>
            <div className="text-xl font-semibold">{settings.buffer_bps ?? 150}</div>
          </div>
          <div className="p-3 rounded-lg border">
            <div className="text-sm text-muted-foreground">Supported</div>
            <div className="text-sm">{(settings.supported || []).join(' · ')}</div>
          </div>
          <div className="p-3 rounded-lg border">
            <div className="text-sm text-muted-foreground">CNY rounding</div>
            <div className="text-sm">{settings.cny_rounding || 'yuan'}</div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border">
            <div className="text-sm text-muted-foreground mb-1">USD rates updated</div>
            <div className="text-sm">
              {usd?.updated_at ? new Date(usd.updated_at).toLocaleString() : '—'}
            </div>
          </div>
          <div className="p-3 rounded-lg border">
            <div className="text-sm text-muted-foreground mb-1">EUR rates updated</div>
            <div className="text-sm">
              {eur?.updated_at ? new Date(eur.updated_at).toLocaleString() : '—'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
