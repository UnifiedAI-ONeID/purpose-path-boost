import { useMemo } from 'react';
import { Card } from './ui/card';
import { engagementScore, ctr, platformLift } from '@/lib/analytics-helpers';

interface MetricsInsightsProps {
  metrics: any[];
}

export default function SocialMetricsInsights({ metrics }: MetricsInsightsProps) {
  const insights = useMemo(() => {
    if (!metrics || metrics.length === 0) return null;

    const platforms = ['linkedin', 'facebook', 'instagram', 'x'];
    const lifts = platforms.map(p => ({
      platform: p,
      ...platformLift(metrics, p)
    }));

    // Best performing platform
    const bestPlatform = lifts.reduce((best, current) => 
      current.engagement > best.engagement ? current : best
    );

    // Average CTR across platforms
    const avgCTR = metrics
      .map(m => ctr(m))
      .filter(c => c !== null)
      .reduce((sum, c, _, arr) => sum + (c || 0) / arr.length, 0);

    // Total engagement
    const totalEngagement = metrics.reduce((sum, m) => sum + engagementScore(m), 0);

    return {
      lifts,
      bestPlatform,
      avgCTR,
      totalEngagement,
    };
  }, [metrics]);

  if (!insights) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          No metrics available for insights
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Performance Insights</h3>
      
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Best Platform</div>
          <div className="text-2xl font-bold capitalize">{insights.bestPlatform.platform}</div>
          <div className="text-xs text-muted-foreground">
            {insights.bestPlatform.engagement.toLocaleString()} engagements • {insights.bestPlatform.er}% ER
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Average CTR</div>
          <div className="text-2xl font-bold">
            {insights.avgCTR > 0 ? `${insights.avgCTR.toFixed(1)}%` : 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">
            Click-through rate across platforms
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Engagement</div>
          <div className="text-2xl font-bold">{insights.totalEngagement.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">
            Likes + Comments + Shares + Saves
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h4 className="text-sm font-semibold mb-3">Platform Performance</h4>
        <div className="space-y-2">
          {insights.lifts.map(lift => (
            <div key={lift.platform} className="flex items-center justify-between">
              <span className="capitalize text-sm">{lift.platform}</span>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{lift.impressions.toLocaleString()} imp</span>
                <span>{lift.engagement} eng</span>
                <span className="font-medium">{lift.er}% ER</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
