import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import AdminShell from '@/components/admin/AdminShell';
import { trackEvent } from '@/lib/trackEvent';

interface KpiData {
  mrr: number;
  active: number;
  dau: number;
  mau: number;
  completes30: number;
  bookings30: number;
  leads30?: number;
  conversion_rate?: number;
  mrr_trend?: number;
}

export default function Overview() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any>(null);
  const [topContent, setTopContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackEvent('admin_overview_view');
    loadData();
    
    // Refresh every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      console.log('[Admin Overview] Starting to load data');
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        console.log('[Admin Overview] No session found');
        return;
      }

      console.log('[Admin Overview] Calling dashboard-admin-metrics');
      const { data, error } = await supabase.functions.invoke('dashboard-admin-metrics', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });

      if (error) {
        console.error('[Admin Overview] Error loading metrics:', error);
        throw error;
      }
      
      console.log('[Admin Overview] Loaded metrics:', data);
      
      setKpi(data?.kpi || {});
      setAlerts(data?.alerts || []);
      setFunnel(data?.funnel || null);
      setTopContent(data?.top_content || []);
    } catch (error) {
      console.error('[Admin Overview] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n: number) => n ? `$${(n / 100).toFixed(0)}` : '—';
  const pct = (n: number) => n ? `${(n * 100).toFixed(1)}%` : '—';

  if (loading) {
    return <AdminShell><div className="p-6">Loading analytics...</div></AdminShell>;
  }

  return (
    <AdminShell>
    <div className="space-y-6">
      {/* KPI Grid */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="MRR" value={fmt(kpi?.mrr || 0)} trend={kpi?.mrr_trend} />
        <KpiCard title="Active Subscriptions" value={kpi?.active || 0} />
        <KpiCard title="DAU (24h)" value={kpi?.dau || 0} />
        <KpiCard title="MAU (30d)" value={kpi?.mau || 0} />
        <KpiCard title="Lesson Completions (30d)" value={kpi?.completes30 || 0} />
        <KpiCard title="Bookings (30d)" value={kpi?.bookings30 || 0} />
        <KpiCard title="New Leads (30d)" value={kpi?.leads30 || 0} />
        <KpiCard title="Conversion Rate" value={pct(kpi?.conversion_rate || 0)} />
      </section>

      {/* Analytics Grid */}
      <section className="grid md:grid-cols-2 gap-4">
        {/* Funnel */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Conversion Funnel (30d)</h3>
          {funnel ? (
            <div className="space-y-3">
              <FunnelStep label="Sessions" value={funnel.sessions || 0} total={funnel.sessions || 1} />
              <FunnelStep label="Leads" value={funnel.leads || 0} total={funnel.sessions || 1} />
              <FunnelStep label="Calls Booked" value={funnel.calls || 0} total={funnel.sessions || 1} />
              <FunnelStep label="Clients" value={funnel.clients || 0} total={funnel.sessions || 1} />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No funnel data</div>
          )}
        </Card>

        {/* Top Content */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Top Content (30d)</h3>
          {topContent.length > 0 ? (
            <div className="space-y-2">
              {topContent.slice(0, 5).map((item: any) => (
                <div key={item.slug} className="flex justify-between text-sm">
                  <span className="truncate flex-1">{item.title || item.slug}</span>
                  <span className="text-muted-foreground ml-2">{item.completes || item.views}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No content data</div>
          )}
        </Card>
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
              <Link to="/admin/leads">View Leads</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/system">Bump Cache</Link>
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

function FunnelStep({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all"
          style={{ width: `${Math.max(5, percentage)}%` }}
        />
      </div>
    </div>
  );
}

function KpiCard({ title, value, trend }: { title: string; value: any; trend?: number }) {
  return (
    <Card className="p-6">
      <div className="text-sm text-muted-foreground mb-1">{title}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-semibold">{value ?? '—'}</div>
        {trend !== undefined && trend !== 0 && (
          <span className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </Card>
  );
}
