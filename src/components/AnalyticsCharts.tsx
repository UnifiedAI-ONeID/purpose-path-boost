import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsEvent {
  id: string;
  event_name: string;
  properties: Record<string, string | number | boolean | undefined>;
  created_at: string;
  page_url: string;
  session_id: string;
}

interface AnalyticsChartsProps {
  events: AnalyticsEvent[];
}

const COLORS = ['#8b5cf6', '#d946ef', '#f97316', '#0ea5e9', '#10b981', '#f59e0b'];

export const AnalyticsCharts = ({ events }: AnalyticsChartsProps) => {
  // Event distribution by type
  const eventDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    events.forEach((event) => {
      distribution[event.event_name] = (distribution[event.event_name] || 0) + 1;
    });
    return Object.entries(distribution)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [events]);

  // Events over time (last 7 days)
  const eventsOverTime = useMemo(() => {
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateDateString('en-US', { month: 'short', day: 'numeric' }),
        events: 0,
      };
    });

    events.forEach((event) => {
      const eventDate = new Date(event.created_at);
      const daysDiff = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < 7) {
        const index = 6 - daysDiff;
        if (index >= 0 && index < 7) {
          last7Days[index].events++;
        }
      }
    });

    return last7Days;
  }, [events]);

  // Top pages by visits
  const topPages = useMemo(() => {
    const pageViews: Record<string, number> = {};
    events.forEach((event) => {
      if (event.page_url) {
        try {
          const url = new URL(event.page_url);
          const path = url.pathname;
          pageViews[path] = (pageViews[path] || 0) + 1;
        } catch (e) {
          // Skip invalid URLs
        }
      }
    });
    return Object.entries(pageViews)
      .map(([page, views]) => ({ page: page || '/', views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [events]);

  // Conversion funnel with rates
  const conversionFunnel = useMemo(() => {
    const quizViews = events.filter(e => e.event_name === 'lm_view').length;
    const quizCompletes = events.filter(e => e.event_name === 'quiz_complete').length;
    const bookViews = events.filter(e => e.event_name === 'book_view').length;
    const bookStarts = events.filter(e => e.event_name === 'book_start').length;
    const bookCompletes = events.filter(e => e.event_name === 'book_complete').length;

    const funnel = [
      { stage: 'Quiz Views', count: quizViews, rate: 100 },
      { stage: 'Quiz Completed', count: quizCompletes, rate: quizViews > 0 ? (quizCompletes / quizViews * 100) : 0 },
      { stage: 'Book View', count: bookViews, rate: quizCompletes > 0 ? (bookViews / quizCompletes * 100) : 0 },
      { stage: 'Book Started', count: bookStarts, rate: bookViews > 0 ? (bookStarts / bookViews * 100) : 0 },
      { stage: 'Booking Complete', count: bookCompletes, rate: bookStarts > 0 ? (bookCompletes / bookStarts * 100) : 0 },
    ];
    return funnel;
  }, [events]);

  // CTA clicks
  const ctaClicks = useMemo(() => {
    const clicks = events.filter(e => e.event_name === 'cta_click');
    const clicksByButton: Record<string, number> = {};
    clicks.forEach((event) => {
      const button = event.properties?.button || 'Unknown';
      clicksByButton[button] = (clicksByButton[button] || 0) + 1;
    });
    return Object.entries(clicksByButton)
      .map(([button, clicks]) => ({ button, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);
  }, [events]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Events Over Time */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Events Over Time (Last 7 Days)</CardTitle>
          <CardDescription>Daily event volume</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={eventsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="events" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Event Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Event Distribution</CardTitle>
          <CardDescription>Most common events</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={eventDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {eventDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Top Pages</CardTitle>
          <CardDescription>Most visited pages</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPages} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="page" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="views" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>User journey with conversion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionFunnel}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.stage}</p>
                        <p className="text-sm text-muted-foreground">
                          Count: {data.count}
                        </p>
                        <p className="text-sm text-brand-accent">
                          Rate: {data.rate.toFixed(1)}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* CTA Performance */}
      {ctaClicks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>CTA Performance</CardTitle>
            <CardDescription>Most clicked call-to-actions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ctaClicks} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="button" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="clicks" fill="#d946ef" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};