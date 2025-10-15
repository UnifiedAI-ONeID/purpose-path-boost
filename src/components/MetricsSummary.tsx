import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Users, MousePointerClick, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface MetricsSummaryData {
  totals: Array<{ event: string; count: number }>;
  routes: Array<{ route: string; pageviews: number }>;
  funnel: {
    cta_sessions: number;
    slot_sessions: number;
    booked_sessions: number;
  };
  daily: Array<{ day: string; pageviews: number; bookings: number }>;
}

export const MetricsSummary = () => {
  const [data, setData] = useState<MetricsSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const toDate = new Date().toISOString().slice(0, 10);
      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      const { data: result, error } = await supabase.rpc('admin_metrics_summary', {
        p_from: fromDate,
        p_to: toDate,
      });

      if (error) throw error;

      setData(result as unknown as MetricsSummaryData);
    } catch (error: any) {
      console.error('Failed to load metrics:', error);
      toast.error('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

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
        <Button
          variant={dateRange === '7d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateRange('7d')}
        >
          Last 7 Days
        </Button>
        <Button
          variant={dateRange === '30d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateRange('30d')}
        >
          Last 30 Days
        </Button>
        <Button
          variant={dateRange === '90d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDateRange('90d')}
        >
          Last 90 Days
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadMetrics}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pageviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand" />
              <span className="text-2xl font-bold">{totalPageviews.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CTA Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-brand" />
              <span className="text-2xl font-bold">{totalCTAs.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand" />
              <span className="text-2xl font-bold">{totalBookings.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand" />
              <span className="text-2xl font-bold">{conversionRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>User journey from CTA to booking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">CTA Clicked</span>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold">{data.funnel?.cta_sessions || 0}</span>
                <div className="w-32 bg-muted rounded-full h-2">
                  <div className="bg-brand h-2 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Booking Started</span>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold">{data.funnel?.slot_sessions || 0}</span>
                <div className="w-32 bg-muted rounded-full h-2">
                  <div
                    className="bg-brand h-2 rounded-full"
                    style={{
                      width: `${
                        data.funnel?.cta_sessions > 0
                          ? (data.funnel.slot_sessions / data.funnel.cta_sessions) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Booking Completed</span>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold">{data.funnel?.booked_sessions || 0}</span>
                <div className="w-32 bg-muted rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${
                        data.funnel?.cta_sessions > 0
                          ? (data.funnel.booked_sessions / data.funnel.cta_sessions) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Top Pages</CardTitle>
          <CardDescription>Most visited pages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.routes?.slice(0, 10).map((route, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="font-mono text-sm">{route.route}</span>
                <span className="font-bold">{route.pageviews.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Trend</CardTitle>
          <CardDescription>Pageviews and bookings over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.daily?.map((day) => (
              <div key={day.day} className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-24">{day.day}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-brand h-2 rounded-full"
                      style={{
                        width: `${Math.min((day.pageviews / Math.max(...(data.daily?.map(d => d.pageviews) || [1]))) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {day.pageviews}
                  </span>
                </div>
                {day.bookings > 0 && (
                  <span className="text-xs text-green-600 font-medium">
                    {day.bookings} bookings
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
