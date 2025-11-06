import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminShell from '@/components/admin/AdminShell';
import { Card } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';

export default function Analytics() {
  const [metrics, setMetrics] = useState({
    visitors: 0,
    leads: 0,
    bookings: 0,
    revenue: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      const { data, error } = await supabase.functions.invoke('dashboard-admin-metrics', {
        body: { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
      });

      if (error) throw error;
      if (data) {
        setMetrics({
          visitors: data.visitors || 0,
          leads: data.leads || 0,
          bookings: data.bookings || 0,
          revenue: data.revenue || 0,
          conversionRate: data.leads ? (data.bookings / data.leads * 100) : 0
        });
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <AdminShell><div className="p-6">Loading analytics...</div></AdminShell>;
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Insights</h1>
          <p className="text-muted-foreground">Last 30 days performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Visitors</p>
                <p className="text-2xl font-bold">{metrics.visitors.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads</p>
                <p className="text-2xl font-bold">{metrics.leads.toLocaleString()}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bookings</p>
                <p className="text-2xl font-bold">{metrics.bookings.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${(metrics.revenue / 100).toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Conversion Funnel */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Conversion Funnel</h2>
          <div className="space-y-4">
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Visitors</span>
                <span className="text-sm text-muted-foreground">{metrics.visitors}</span>
              </div>
              <div className="w-full bg-accent rounded-full h-8">
                <div className="bg-primary rounded-full h-8" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Leads</span>
                <span className="text-sm text-muted-foreground">{metrics.leads}</span>
              </div>
              <div className="w-full bg-accent rounded-full h-8">
                <div className="bg-primary rounded-full h-8" 
                  style={{ width: `${metrics.visitors ? (metrics.leads / metrics.visitors * 100) : 0}%` }} />
              </div>
            </div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Bookings</span>
                <span className="text-sm text-muted-foreground">{metrics.bookings}</span>
              </div>
              <div className="w-full bg-accent rounded-full h-8">
                <div className="bg-primary rounded-full h-8" 
                  style={{ width: `${metrics.visitors ? (metrics.bookings / metrics.visitors * 100) : 0}%` }} />
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-accent rounded-lg">
            <p className="text-sm font-medium">Conversion Rate: {metrics.conversionRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">From lead to booking</p>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
