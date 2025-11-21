import { useState, useEffect } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';
import { toast } from 'sonner';

interface Coupon {
  code: string;
  percent_off: number;
  expires_at: string;
  max_redemptions: number | null;
  redeemed: number;
  applies_to: string[];
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    try {
      const { data, error } = await supabase.functions.invoke('api-admin-coupons-list');
      if (!error && data?.rows) {
        setCoupons(data.rows);
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body = {
      code: formData.get('code'),
      percent_off: Number(formData.get('percent_off')),
      expires_at: formData.get('expires_at'),
      applies_to: String(formData.get('applies_to')).split(',').map(s => s.trim()),
      max_redemptions: formData.get('max_redemptions') ? Number(formData.get('max_redemptions')) : null,
    };

    try {
      const { error } = await supabase.functions.invoke('api-admin-coupons-save', {
        body
      });
      
      if (error) throw error;
      
      e.currentTarget.reset();
      fetchCoupons();
      toast.success('Coupon created!');
    } catch (error: any) {
      console.error('Failed to create coupon:', error);
      toast.error(error.message || 'Failed to create coupon');
    }
  }

  async function handleDisable(code: string) {
    try {
      const { error } = await supabase.functions.invoke('api-admin-coupons-save', {
        body: { code, active: false }
      });
      
      if (error) throw error;
      fetchCoupons();
      toast.success('Coupon disabled');
    } catch (error: any) {
      console.error('Failed to disable coupon:', error);
      toast.error(error.message || 'Failed to disable coupon');
    }
  }

  if (loading) {
    return (
      <AdminShell>
        <div>Loading...</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold mb-6">Coupons</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Create Coupon</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input name="code" placeholder="CODE2025" required />
            <Input name="percent_off" type="number" placeholder="15" min="1" max="100" required />
            <Input name="expires_at" type="datetime-local" required />
            <Input name="applies_to" placeholder="starter,growth,pro" defaultValue="starter,growth,pro" />
            <Input name="max_redemptions" type="number" placeholder="100 (optional)" />
            <Button type="submit" className="w-full">Create Coupon</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">Active Coupons</h2>
          <div className="space-y-3">
            {coupons.length === 0 ? (
              <p className="text-sm text-muted-foreground">No coupons yet</p>
            ) : (
              coupons.map((c) => (
                <div
                  key={c.code}
                  className="border border-border rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">
                      {c.code} — {c.percent_off}% off
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Redemptions: {c.redeemed || 0}
                      {c.max_redemptions ? `/${c.max_redemptions}` : ''}
                      {' · '}
                      Ends {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'never'}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisable(c.code)}
                  >
                    Disable
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
