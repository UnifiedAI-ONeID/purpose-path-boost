import { useState, useEffect, useCallback } from 'react';
import { functions } from '@/firebase/config';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Users, MousePointerClick, Calendar } from 'lucide-react';
import { toast } from 'sonner';

// Firebase Cloud Function
const getMetricsSummary = httpsCallable(functions, 'api-admin-metrics-summary');

// Type Definitions
interface Metric {
  event: string;
  count: number;
}

interface RouteMetric {
  route: string;
  pageviews: number;
}

interface FunnelMetrics {
  cta_sessions: number;
  slot_sessions: number;
  booked_sessions: number;
}

interface DailyMetric {
  day: string;
  pageviews: number;
  bookings: number;
}

interface MetricsData {
  totals: Metric[];
  routes: RouteMetric[];
  funnel: FunnelMetrics;
  daily: DailyMetric[];
}

export const MetricsSummary = () => {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const toDate = new Date().toISOString().slice(0, 10);
      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const result: HttpsCallableResult<MetricsData> = await getMetricsSummary({ p_from: fromDate, p_to: toDate });
      setData(result.data);

    } catch (error) {
      console.error('Failed to load metrics:', error);
      toast.error('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No metrics data available yet. Events will appear here once tracked.
        </CardContent>
      </Card>
    );
  }

  const totalPageviews = data.totals?.find(t => t.event === 'page_view')?.count || 0;
  const totalCTAs = data.totals?.find(t => t.event === 'cta_click')?.count || 0;
  const totalBookings = data.totals?.find(t => t.event === 'book_complete')?.count || 0;

  const conversionRate = data.funnel?.cta_sessions > 0
    ? ((data.funnel.booked_sessions / data.funnel.cta_sessions) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center gap-2">
        <Button variant={dateRange === '7d' ? 'default' : 'outline'} size="sm" onClick={() => setDateRange('7d')}>7d</Button>
        <Button variant={dateRange === '30d' ? 'default' : 'outline'} size="sm" onClick={() => setDateRange('30d')}>30d</Button>
        <Button variant={dateRange === '90d' ? 'default' : 'outline'} size="sm" onClick={() => setDateRange('90d')}>90d</Button>
        <Button variant="ghost" size="sm" onClick={loadMetrics} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pageviews</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-brand" /><span className="text-2xl font-bold">{totalPageviews.toLocaleString()}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">CTA Clicks</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><MousePointerClick className="h-4 w-4 text-brand" /><span className="text-2xl font-bold">{totalCTAs.toLocaleString()}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Bookings</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-brand" /><span className="text-2xl font-bold">{totalBookings.toLocaleString()}</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Conversion</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><Users className="h-4 w-4 text-brand" /><span className="text-2xl font-bold">{conversionRate}%</span></div></CardContent></Card>
      </div>

      {/* Charts and details... */}
    </div>
  );
};
