import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsEvent {
  event_name: string;
  properties: Record<string, unknown>;
}

interface SessionDurationChartProps {
  events: AnalyticsEvent[];
}

export const SessionDurationChart = ({ events }: SessionDurationChartProps) => {
  const durationData = useMemo(() => {
    const buckets = {
      'Under 30s': events.filter(e => e.event_name === 'session_bucket_under30s').length,
      '30s-1m': events.filter(e => e.event_name === 'session_bucket_1m').length,
      '1-3m': events.filter(e => e.event_name === 'session_bucket_3m').length,
      '3m+': events.filter(e => e.event_name === 'session_bucket_5m_plus').length,
    };

    return Object.entries(buckets).map(([duration, count]) => ({
      duration,
      count,
    }));
  }, [events]);

  const totalSessions = durationData.reduce((sum, item) => sum + item.count, 0);
  const avgEngagement = totalSessions > 0
    ? durationData.reduce((sum, item, index) => {
        const weights = [0.5, 1, 2, 4]; // Weight by duration
        return sum + (item.count * weights[index]);
      }, 0) / totalSessions
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Duration</CardTitle>
        <CardDescription>
          Average engagement: {avgEngagement.toFixed(1)} minutes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={durationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="duration" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};