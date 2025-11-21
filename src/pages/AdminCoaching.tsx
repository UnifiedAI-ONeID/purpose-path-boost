import AdminShell from '../components/admin/AdminShell';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';
import { invokeApi } from '@/lib/api-client';

type Offer = {
  slug: string;
  title_en: string;
  billing_type: 'free' | 'paid';
  base_currency: string;
  base_price_cents: number;
  cal_event_type_slug: string;
  active: boolean;
  sort: number;
};

export default function AdminCoaching() {
  const [rows, setRows] = useState<Offer[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reload();
  }, []);

  async function reload() {
    setLoading(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const r = await invokeApi('/api/admin/coaching/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRows(r.rows || []);
    } catch (err) {
      console.error('Failed to load coaching offers:', err);
      toast.error('Failed to load coaching offers');
      setRows([]);
    }
    setLoading(false);
  }

  async function save(row: Offer) {
    setBusy(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const r = await invokeApi('/api/admin/coaching/save', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: row
      });
      
      if (r.ok) {
        toast.success('Saved successfully');
        reload();
      } else {
        toast.error(r.error || 'Failed to save');
      }
    } catch (err) {
      console.error('Failed to save:', err);
      toast.error('Failed to save');
    }
    setBusy(false);
  }

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Coaching Offers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage coaching programs, pricing, and Cal.com integration
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="p-3">Slug</th>
                <th className="p-3">Title</th>
                <th className="p-3">Type</th>
                <th className="p-3">Price</th>
                <th className="p-3">Cal.com Slug</th>
                <th className="p-3">Active</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.slug} className="border-b border-border last:border-0">
                  <td className="p-3 font-mono text-xs">{r.slug}</td>
                  <td className="p-3">
                    <input
                      className="w-full px-2 py-1 rounded border border-border bg-background"
                      defaultValue={r.title_en}
                      onChange={e => (rows[i].title_en = e.target.value)}
                    />
                  </td>
                  <td className="p-3">
                    <select
                      className="px-2 py-1 rounded border border-border bg-background"
                      defaultValue={r.billing_type}
                      onChange={e => (rows[i].billing_type = e.target.value as any)}
                    >
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <select
                        className="w-20 px-2 py-1 rounded border border-border bg-background"
                        defaultValue={r.base_currency}
                        onChange={e => (rows[i].base_currency = e.target.value)}
                      >
                        {['USD', 'CAD', 'EUR', 'GBP', 'HKD', 'SGD', 'CNY'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <input
                        className="w-24 px-2 py-1 rounded border border-border bg-background"
                        type="number"
                        step="0.01"
                        defaultValue={(r.base_price_cents / 100).toFixed(2)}
                        onChange={e =>
                          (rows[i].base_price_cents = Math.round(parseFloat(e.target.value || '0') * 100))
                        }
                      />
                    </div>
                  </td>
                  <td className="p-3">
                    <input
                      className="w-full px-2 py-1 rounded border border-border bg-background font-mono text-xs"
                      defaultValue={r.cal_event_type_slug}
                      onChange={e => (rows[i].cal_event_type_slug = e.target.value)}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      defaultChecked={r.active}
                      onChange={e => (rows[i].active = e.target.checked)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="p-3">
                    <button
                      className="px-3 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      disabled={busy}
                      onClick={() => save(rows[i])}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
