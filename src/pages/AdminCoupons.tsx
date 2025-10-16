import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminCoupons() {
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    percent_off: null as number | null,
    amount_off_cents: null as number | null,
    currency: 'USD',
    applies_to_slug: '',
    valid_from: new Date().toISOString().slice(0, 16),
    valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    max_redemptions: null as number | null,
    per_user_limit: 1,
    active: true
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/admin/coupons/list', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json());
      
      setRows(res.rows || []);
    } catch (err) {
      console.error('Failed to load coupons:', err);
      toast.error('Failed to load coupons');
      setRows([]);
    }
  }

  async function save(row: any) {
    setBusy(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      await fetch('/api/admin/coupons/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(row)
      });
      
      toast.success('Coupon saved successfully');
      load();
    } catch (err) {
      console.error('Failed to save coupon:', err);
      toast.error('Failed to save coupon');
    }
    setBusy(false);
  }

  async function addNew() {
    if (!newCoupon.code.trim()) return;
    await save({ ...newCoupon, code: newCoupon.code.toUpperCase() });
    setNewCoupon({
      code: '',
      description: '',
      percent_off: null,
      amount_off_cents: null,
      currency: 'USD',
      applies_to_slug: '',
      valid_from: new Date().toISOString().slice(0, 16),
      valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      max_redemptions: null,
      per_user_limit: 1,
      active: true
    });
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Coupon Management</h1>

      {/* Add New Coupon */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Coupon</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Input
            placeholder="CODE"
            value={newCoupon.code}
            onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
          />
          <Input
            placeholder="Description"
            value={newCoupon.description}
            onChange={e => setNewCoupon({ ...newCoupon, description: e.target.value })}
          />
          <Input
            type="number"
            placeholder="% off"
            value={newCoupon.percent_off || ''}
            onChange={e => setNewCoupon({
              ...newCoupon,
              percent_off: e.target.value ? parseInt(e.target.value) : null,
              amount_off_cents: null
            })}
          />
          <Input
            type="number"
            placeholder="Amount off (cents)"
            value={newCoupon.amount_off_cents || ''}
            onChange={e => setNewCoupon({
              ...newCoupon,
              amount_off_cents: e.target.value ? parseInt(e.target.value) : null,
              percent_off: null
            })}
          />
        </div>
        <Button onClick={addNew} disabled={busy || !newCoupon.code.trim()}>
          Add Coupon
        </Button>
      </Card>

      {/* Existing Coupons */}
      <Card className="p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">Code</th>
              <th className="p-2">Description</th>
              <th className="p-2">Discount</th>
              <th className="p-2">Currency</th>
              <th className="p-2">Offer</th>
              <th className="p-2">Valid From</th>
              <th className="p-2">Valid To</th>
              <th className="p-2">Max Uses</th>
              <th className="p-2">Per User</th>
              <th className="p-2">Active</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id} className="border-b">
                <td className="p-2 font-mono font-semibold">{row.code}</td>
                <td className="p-2">{row.description || '—'}</td>
                <td className="p-2">
                  {row.percent_off ? `${row.percent_off}%` : ''}
                  {row.amount_off_cents ? `$${(row.amount_off_cents / 100).toFixed(2)}` : ''}
                </td>
                <td className="p-2">{row.currency || '—'}</td>
                <td className="p-2">{row.applies_to_slug || 'Any'}</td>
                <td className="p-2">{new Date(row.valid_from).toLocaleDateString()}</td>
                <td className="p-2">{new Date(row.valid_to).toLocaleDateString()}</td>
                <td className="p-2">{row.max_redemptions || '∞'}</td>
                <td className="p-2">{row.per_user_limit}</td>
                <td className="p-2">{row.active ? '✓' : '✗'}</td>
                <td className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => save({ ...row, active: !row.active })}
                    disabled={busy}
                  >
                    {row.active ? 'Disable' : 'Enable'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </main>
  );
}
