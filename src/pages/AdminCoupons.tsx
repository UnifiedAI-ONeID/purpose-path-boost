/**
 * @file Admin page for creating and managing promotional coupons.
 */

import { useState, useEffect, useCallback, FormEvent } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { functions } from '@/firebase/config';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';
import { logger } from '@/lib/log';

// --- Type Definitions ---

interface Coupon {
  code: string;
  percent_off: number;
  expires_at: string;
  max_redemptions: number | null;
  redeemed: number;
  applies_to: string[];
  active?: boolean;
}

// --- Firebase Cloud Function References ---

const listAdminCoupons = httpsCallable<void, { rows: Coupon[] }>(functions, 'api-admin-coupons-list');
const saveAdminCoupon = httpsCallable<Partial<Coupon>, void>(functions, 'api-admin-coupons-save');

// --- Main Component ---

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCoupons = useCallback(async () => {
    try {
      const result = await listAdminCoupons();
      setCoupons(result.data?.rows || []);
    } catch (error) {
      logger.error('[AdminCoupons] Failed to fetch coupons.', { error });
      toast.error('Failed to load coupons.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreate = async (newCouponData: Omit<Coupon, 'redeemed'>) => {
    try {
      await saveAdminCoupon(newCouponData);
      toast.success(`Coupon "${newCouponData.code}" created!`);
      await fetchCoupons();
      return true; // Indicate success
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to create coupon.';
      logger.error('[AdminCoupons] Failed to create coupon.', { error });
      toast.error(errorMessage);
      return false; // Indicate failure
    }
  };

  const handleDisable = async (code: string) => {
    try {
      await saveAdminCoupon({ code, active: false });
      toast.success(`Coupon "${code}" disabled.`);
      await fetchCoupons();
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to disable coupon.';
      logger.error(`[AdminCoupons] Failed to disable coupon ${code}.`, { error });
      toast.error(errorMessage);
    }
  };
  
  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold mb-6">Coupon Management</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <CreateCouponForm onCreate={handleCreate} />
        <ActiveCouponsList coupons={coupons} onDisable={handleDisable} loading={loading} />
      </div>
    </AdminShell>
  );
}

// --- Sub-components ---

const CreateCouponForm = ({ onCreate }: { onCreate: (data: Omit<Coupon, 'redeemed'>) => Promise<boolean> }) => {
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newCoupon = {
            code: formData.get('code') as string,
            percent_off: Number(formData.get('percent_off')),
            expires_at: formData.get('expires_at') as string,
            applies_to: (formData.get('applies_to') as string).split(',').map(s => s.trim()),
            max_redemptions: formData.get('max_redemptions') ? Number(formData.get('max_redemptions')) : null,
            active: true,
        };
        const success = await onCreate(newCoupon);
        if (success) {
            e.currentTarget.reset();
        }
    };

    return (
        <Card className="p-6">
            <h2 className="font-semibold mb-4">Create New Coupon</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="code" placeholder="e.g., LAUNCH25" required />
                <Input name="percent_off" type="number" placeholder="Percent Off (e.g., 15)" min="1" max="100" required />
                <Input name="expires_at" type="datetime-local" required />
                <Input name="applies_to" placeholder="Applicable plan slugs (comma-separated)" defaultValue="starter,growth,pro" />
                <Input name="max_redemptions" type="number" placeholder="Max Redemptions (optional)" />
                <Button type="submit" className="w-full">Create Coupon</Button>
            </form>
        </Card>
    );
};

const ActiveCouponsList = ({ coupons, onDisable, loading }: { coupons: Coupon[], onDisable: (code: string) => void, loading: boolean }) => (
    <Card className="p-6">
        <h2 className="font-semibold mb-4">Active Coupons</h2>
        {loading ? <p>Loading...</p> : (
            <div className="space-y-3">
                {coupons.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active coupons found.</p>
                ) : (
                    coupons.map(c => (
                        <div key={c.code} className="border border-border rounded-lg p-3 flex items-center justify-between">
                            <div>
                                <div className="font-medium">{c.code} — {c.percent_off}% off</div>
                                <div className="text-sm text-muted-foreground">
                                    Redeemed: {c.redeemed || 0}{c.max_redemptions ? `/${c.max_redemptions}` : ''}
                                    {' · Expires: '}
                                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => onDisable(c.code)}>Disable</Button>
                        </div>
                    ))
                )}
            </div>
        )}
    </Card>
);
