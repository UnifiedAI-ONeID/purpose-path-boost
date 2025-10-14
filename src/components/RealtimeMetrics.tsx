import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, TrendingUp, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  change?: number;
}

const MetricCard = ({ title, value, icon, change }: MetricCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-2xl font-bold text-brand-accent"
        >
          {value.toLocaleString()}
        </motion.div>
      </AnimatePresence>
      {change !== undefined && (
        <p className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'} mt-1`}>
          {change >= 0 ? '+' : ''}{change}% from yesterday
        </p>
      )}
    </CardContent>
  </Card>
);

export const RealtimeMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalEvents: 0,
    activeUsers: 0,
    quizCompletions: 0,
    bookings: 0,
  });
  const [previousMetrics, setPreviousMetrics] = useState(metrics);

  useEffect(() => {
    // Initial load
    loadMetrics();

    // Set up realtime subscription
    const channel = supabase
      .channel('analytics-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events',
        },
        (payload) => {
          console.log('New analytics event:', payload);
          loadMetrics();
        }
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const loadMetrics = async () => {
    try {
      // Get today's events
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todayEvents, error: todayError } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', today.toISOString());

      if (todayError) throw todayError;

      // Get yesterday's events for comparison
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: yesterdayEvents, error: yesterdayError } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString());

      if (yesterdayError) throw yesterdayError;

      // Calculate metrics
      const uniqueSessions = new Set(todayEvents?.map(e => e.session_id) || []).size;
      const quizCompletions = todayEvents?.filter(e => e.event_name === 'quiz_complete').length || 0;
      const bookings = todayEvents?.filter(e => e.event_name === 'book_complete').length || 0;

      const yesterdayUniqueSessions = new Set(yesterdayEvents?.map(e => e.session_id) || []).size;

      setPreviousMetrics(metrics);
      setMetrics({
        totalEvents: todayEvents?.length || 0,
        activeUsers: uniqueSessions,
        quizCompletions,
        bookings,
      });
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Events Today"
        value={metrics.totalEvents}
        icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        change={calculateChange(metrics.totalEvents, previousMetrics.totalEvents)}
      />
      <MetricCard
        title="Active Users"
        value={metrics.activeUsers}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        change={calculateChange(metrics.activeUsers, previousMetrics.activeUsers)}
      />
      <MetricCard
        title="Quiz Completions"
        value={metrics.quizCompletions}
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        change={calculateChange(metrics.quizCompletions, previousMetrics.quizCompletions)}
      />
      <MetricCard
        title="Bookings"
        value={metrics.bookings}
        icon={<Eye className="h-4 w-4 text-muted-foreground" />}
        change={calculateChange(metrics.bookings, previousMetrics.bookings)}
      />
    </div>
  );
};