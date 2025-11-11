import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminShell from '@/components/admin/AdminShell';
import { Card } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, Target, Eye, MousePointer } from 'lucide-react';
import { trackEvent } from '@/lib/trackEvent';

interface MetricsData {
  kpi: {
    mrr: number;
    active: number;
    dau: number;
    mau: number;
    completes30: number;
    bookings30: number;
    leads30: number;
    conversion_rate: number;
  };
  funnel: {
    sessions: number;
    leads: number;
    calls: number;
    clients: number;
  };
  top_content: Array<{ slug: string; title: string; starts: number; completes: number }>;
}

export default function Analytics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackEvent('admin_analytics_view');
    loadMetrics();
    
    // Refresh every minute
    const interval = setInterval(loadMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadMetrics() {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        console.error('No session found');
        return;
      }

      const { data, error } = await supabase.functions.invoke('dashboard-admin-metrics', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });

      if (error) throw error;
      if (data?.ok) {
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </AdminShell>
    );
  }

  if (!metrics) {
    return (
      <AdminShell>
        <div className="p-6">
          <div className="text-center text-muted-foreground">
            Failed to load analytics data. Please refresh the page.
          </div>
        </div>
      </AdminShell>
    );
  }

  const { kpi, funnel, top_content } = metrics;

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Insights</h1>
          <p className="text-muted-foreground">Last 30 days performance</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">DAU (24h)</p>
                <p className="text-2xl font-bold">{kpi.dau.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MAU (30d)</p>
                <p className="text-2xl font-bold">{kpi.mau.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Leads</p>
                <p className="text-2xl font-bold">{kpi.leads30.toLocaleString()}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bookings</p>
                <p className="text-2xl font-bold">{kpi.bookings30.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MRR</p>
                <p className="text-2xl font-bold">${(kpi.mrr / 100).toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Subs</p>
                <p className="text-2xl font-bold">{kpi.active.toLocaleString()}</p>
              </div>
              <MousePointer className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lesson Completes</p>
                <p className="text-2xl font-bold">{kpi.completes30.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{(kpi.conversion_rate * 100).toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Conversion Funnel */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Conversion Funnel (30d)</h2>
            <div className="space-y-4">
              <FunnelStep label="Sessions" value={funnel.sessions} total={funnel.sessions} />
              <FunnelStep label="Leads" value={funnel.leads} total={funnel.sessions} />
              <FunnelStep label="Calls Booked" value={funnel.calls} total={funnel.sessions} />
              <FunnelStep label="Clients" value={funnel.clients} total={funnel.sessions} />
            </div>
            <div className="mt-6 p-4 bg-accent rounded-lg">
              <p className="text-sm font-medium">
                Lead → Client: {funnel.leads > 0 ? ((funnel.clients / funnel.leads) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Overall conversion rate</p>
            </div>
          </Card>

          {/* Top Content */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Top Content (30d)</h2>
            {top_content && top_content.length > 0 ? (
              <div className="space-y-3">
                {top_content.slice(0, 8).map((item, idx) => (
                  <div key={item.slug || idx} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title || item.slug}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.starts || 0} starts · {item.completes || 0} completes
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-bold">{item.completes || 0}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.starts > 0 ? ((item.completes / item.starts) * 100).toFixed(0) : 0}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                No content data available
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}

function FunnelStep({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${Math.max(2, percentage)}%` }}
        />
      </div>
    </div>
  );
}
