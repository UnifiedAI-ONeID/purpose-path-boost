import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from './ui/card';
import SocialMetricsInsights from './SocialMetricsInsights';

function MiniLineChart({ data }: { data: number[] }) {
  if (!data.length) return <div className="h-10" />;
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 100}`).join(' ');
  
  return (
    <svg viewBox="0 0 100 100" className="w-full h-10">
      <polyline 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        points={points}
        className="text-primary opacity-80"
      />
    </svg>
  );
}

export default function SocialAnalytics() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      const { data, error } = await supabase
        .from('social_metrics')
        .select('*')
        .order('captured_at');
      
      if (error) throw error;
      setRows(data || []);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  const byPlatform = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const row of rows) {
      if (!map[row.platform]) map[row.platform] = [];
      map[row.platform].push(row);
    }
    return map;
  }, [rows]);

  const getTotalForPlatform = (platform: string, key: string) => {
    return (byPlatform[platform] || []).reduce((sum, row) => sum + (row[key] || 0), 0);
  };

  const platforms = Object.keys(byPlatform);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Loading analytics...</div>
      </Card>
    );
  }

  if (platforms.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Social Analytics</h2>
        <div className="text-center text-muted-foreground">
          No metrics available yet. Collect metrics from your posted content.
        </div>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">Social Analytics</h2>
      
      {/* Performance Insights */}
      <SocialMetricsInsights metrics={rows} />
      
      <div className="grid md:grid-cols-4 gap-4">
        {platforms.map(platform => (
          <Card key={platform} className="p-4">
            <div className="text-sm text-muted-foreground capitalize mb-1">{platform}</div>
            <div className="text-2xl font-semibold mb-1">
              {getTotalForPlatform(platform, 'impressions').toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">impressions</div>
            <div className="mt-2 text-sm space-y-1">
              <div>{getTotalForPlatform(platform, 'likes')} likes</div>
              <div>{getTotalForPlatform(platform, 'comments')} comments</div>
              <div>{getTotalForPlatform(platform, 'shares')} shares</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-2">Impressions Over Time</div>
          <MiniLineChart data={rows.map(r => r.impressions || 0)} />
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-2">Total Engagements</div>
          <MiniLineChart 
            data={rows.map(r => (r.likes || 0) + (r.comments || 0) + (r.shares || 0))} 
          />
        </Card>
      </div>
    </section>
  );
}
