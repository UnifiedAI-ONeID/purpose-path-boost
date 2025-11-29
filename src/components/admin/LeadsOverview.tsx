import { useEffect, useState } from 'react';
import { functions } from '@/firebase/config';
import { httpsCallable } from 'firebase/functions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const getLeadsAnalytics = httpsCallable(functions, 'api-admin-leads-analytics');

export default function LeadsOverview() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const response = await getLeadsAnalytics();
      const data = response.data as { ok: boolean, analytics: any, error: string };

      if (data?.ok && data.analytics) {
        setAnalytics(data.analytics);
      } else {
        console.error('[LeadsOverview] Analytics error:', data?.error);
        toast.error('Failed to load analytics');
      }
    } catch (error) {
      console.error('[LeadsOverview] Error:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchAnalytics, 60000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics?.summary) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No analytics data available
        </CardContent>
      </Card>
    );
  }

  const cards = [
    { label: 'Total Leads', value: analytics.summary.totalLeads },
    { label: 'Won (Clients)', value: analytics.summary.wonLeads },
    { label: 'Today', value: analytics.summary.todayLeads },
    { label: 'Conversion Rate', value: `${analytics.summary.conversionRate}%` },
    { label: 'Week Growth', value: `${analytics.summary.weekOverWeekGrowth > 0 ? '+' : ''}${analytics.summary.weekOverWeekGrowth.toFixed(1)}%` },
    { label: 'Avg Clarity', value: analytics.summary.avgClarityScore.toFixed(1) }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Breakdown Charts */}
      {analytics?.breakdown && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* By Stage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">By Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analytics.breakdown.byStage).map(([stage, count]: [string, any]) => (
                  <div key={stage} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{stage}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(count / analytics.summary.totalLeads) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* By Source */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">By Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analytics.breakdown.bySource).map(([source, count]: [string, any]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{source}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(count / analytics.summary.totalLeads) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* By Language */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">By Language</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analytics.breakdown.byLanguage).map(([lang, count]: [string, any]) => (
                  <div key={lang} className="flex items-center justify-between">
                    <span className="text-sm uppercase">{lang}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(count / analytics.summary.totalLeads) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* By Country */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">By Country</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analytics.breakdown.byCountry).map(([country, count]: [string, any]) => (
                  <div key={country} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{country}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(count / analytics.summary.totalLeads) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
