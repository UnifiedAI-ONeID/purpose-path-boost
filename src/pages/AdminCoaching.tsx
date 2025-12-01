/**
 * @file Admin page for managing coaching offers, including pricing and Cal.com integration.
 */

import AdminShell from '../components/admin/AdminShell';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { fx } from '@/lib/edge';
import { logger } from '@/lib/log';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// --- Type Definitions ---

interface Offer {
  slug: string;
  title_en: string;
  billing_type: 'free' | 'paid';
  base_currency: string;
  base_price_cents: number;
  cal_event_type_slug: string;
  active: boolean;
  sort: number;
}

// --- Main Component ---

export default function AdminCoaching() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const reloadOffers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fx<{ rows: Offer[] }>('api-admin-coaching-list', 'GET');
      setOffers(response.rows || []);
    } catch (error) {
      logger.error('[AdminCoaching] Failed to load offers.', { error });
      toast.error('Failed to load coaching offers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadOffers();
  }, [reloadOffers]);

  const handleSave = async (offer: Offer) => {
    setBusy(true);
    try {
      const response = await fx<{ ok: boolean; error?: string }>('api-admin-coaching-save', 'POST', offer);
      if (response.ok) {
        toast.success(`Offer "${offer.title_en}" saved successfully.`);
        await reloadOffers();
      } else {
        toast.error(response.error || 'Failed to save offer.');
      }
    } catch (error) {
      logger.error(`[AdminCoaching] Failed to save offer ${offer.slug}.`, { error });
      toast.error('An unexpected error occurred while saving.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell>
      <Header />
      {loading ? <LoadingSpinner /> : (
        <OffersTable offers={offers} onSave={handleSave} busy={busy} setOffers={setOffers} />
      )}
    </AdminShell>
  );
}

// --- Sub-components ---

const Header = () => (
  <div className="mb-6">
    <h1 className="text-2xl font-semibold">Coaching Offers</h1>
    <p className="text-sm text-muted-foreground mt-1">
      Manage coaching programs, pricing, and Cal.com integration.
    </p>
  </div>
);

const OffersTable = ({ offers, onSave, busy, setOffers }: { offers: Offer[]; onSave: (offer: Offer) => void; busy: boolean; setOffers: React.Dispatch<React.SetStateAction<Offer[]>> }) => {
    
    const handleFieldChange = (slug: string, field: keyof Offer, value: any) => {
        setOffers(currentOffers =>
            currentOffers.map(offer =>
                offer.slug === slug ? { ...offer, [field]: value } : offer
            )
        );
    };

    return (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Slug</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Cal.com Slug</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {offers.map(offer => (
                        <OfferRow
                            key={offer.slug}
                            offer={offer}
                            onSave={onSave}
                            busy={busy}
                            onFieldChange={handleFieldChange}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

const OfferRow = ({ offer, onSave, busy, onFieldChange }: { offer: Offer; onSave: (offer: Offer) => void; busy: boolean; onFieldChange: (slug: string, field: keyof Offer, value: any) => void; }) => (
    <TableRow>
        <TableCell className="font-mono text-xs">{offer.slug}</TableCell>
        <TableCell>
            <Input value={offer.title_en} onChange={e => onFieldChange(offer.slug, 'title_en', e.target.value)} />
        </TableCell>
        <TableCell>
            <Select value={offer.billing_type} onValueChange={value => onFieldChange(offer.slug, 'billing_type', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
            </Select>
        </TableCell>
        <TableCell>
            <div className="flex gap-1">
                <Select value={offer.base_currency} onValueChange={value => onFieldChange(offer.slug, 'base_currency', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {['USD', 'CAD', 'EUR', 'GBP', 'HKD', 'SGD', 'CNY'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Input
                    type="number"
                    step="0.01"
                    value={(offer.base_price_cents / 100).toFixed(2)}
                    onChange={e => onFieldChange(offer.slug, 'base_price_cents', Math.round(parseFloat(e.target.value || '0') * 100))}
                />
            </div>
        </TableCell>
        <TableCell>
            <Input value={offer.cal_event_type_slug} onChange={e => onFieldChange(offer.slug, 'cal_event_type_slug', e.target.value)} />
        </TableCell>
        <TableCell>
            <Checkbox checked={offer.active} onCheckedChange={checked => onFieldChange(offer.slug, 'active', checked)} />
        </TableCell>
        <TableCell>
            <Button size="sm" onClick={() => onSave(offer)} disabled={busy}>Save</Button>
        </TableCell>
    </TableRow>
);

const LoadingSpinner = () => (
  <div className="text-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
    <p className="mt-2 text-muted-foreground">Loading offers...</p>
  </div>
);
