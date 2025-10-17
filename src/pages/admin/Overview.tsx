import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import AdminShell from '@/components/admin/AdminShell';

interface KpiData {
  mrr: number;
  active: number;
  dau: number;
  mau: number;
  completes30: number;
  bookings30: number;
}

export default function Overview() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) return;

      const { data, error } = await supabase.functions.invoke('api-admin-analytics-overview', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });

      if (error) {
        console.error('[Admin Overview] Analytics API error:', error);
        // Return mock data as fallback
        setKpi({
          mrr: 0,
          active: 0,
          dau: 0,
          mau: 0,
          completes30: 0,
          bookings30: 0
        });
        setAlerts([{ id: '1', text: 'Analytics API unavailable - using fallback data' }]);
        setLoading(false);
        return;
      }
      
      // Map analytics response to KPI structure
      const analytics = data?.analytics || {};
      setKpi({
        mrr: analytics.mrr_cents || 0,
        active: analytics.clients_28d || 0,
        dau: analytics.sessions_28d || 0,
        mau: analytics.sessions_28d || 0,
        completes30: analytics.calls_28d || 0,
        bookings30: analytics.calls_28d || 0
      });
      setAlerts([]);
    } catch (error) {
      console.error('[Admin Overview] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n: number) => n ? `$${(n / 100).toFixed(0)}` : '—';

  if (loading) {
    return <AdminShell><div className="p-6">Loading...</div></AdminShell>;
  }

  return (
    <AdminShell>
    <div className="space-y-6">
      {/* KPI Grid */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="MRR" value={fmt(kpi?.mrr || 0)} />
        <KpiCard title="Active Subscriptions" value={kpi?.active || 0} />
        <KpiCard title="Lesson Completions (30d)" value={kpi?.completes30 || 0} />
        <KpiCard title="Bookings (30d)" value={kpi?.bookings30 || 0} />
      </section>

      {/* Quick Actions & Alerts */}
      <section className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="default">
              <Link to="/admin/marketing">Create Coupon</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/integrations">Update API Keys</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/system">SEO & Cache</Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">System Alerts</h3>
          <ul className="text-sm space-y-2">
            {alerts.length > 0 ? (
              alerts.map((a: any) => (
                <li key={a.id} className="text-muted-foreground">• {a.text}</li>
              ))
            ) : (
              <li className="text-muted-foreground">No alerts</li>
            )}
          </ul>
        </Card>
      </section>
    </div>
    </AdminShell>
  );
}

function KpiCard({ title, value }: { title: string; value: any }) {
  return (
    <Card className="p-6">
      <div className="text-sm text-muted-foreground mb-1">{title}</div>
      <div className="text-2xl font-semibold">{value ?? '—'}</div>
    </Card>
  );
}
