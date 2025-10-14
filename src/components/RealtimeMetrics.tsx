import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, TrendingUp, Eye, Award } from 'lucide-react';
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
    quizViews: 0,
    bookViews: 0,
    avgClarityScore: 0,
    conversionRate: 0,
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

      // Calculate today's metrics
      const uniqueSessions = new Set(todayEvents?.map(e => e.session_id) || []).size;
      const quizViews = todayEvents?.filter(e => e.event_name === 'lm_view').length || 0;
      const quizCompletions = todayEvents?.filter(e => e.event_name === 'quiz_complete').length || 0;
      const bookViews = todayEvents?.filter(e => e.event_name === 'book_view').length || 0;
      const bookings = todayEvents?.filter(e => e.event_name === 'book_complete').length || 0;
      
      // Calculate average clarity score
      const scoresFromQuiz = todayEvents
        ?.filter(e => {
          if (e.event_name !== 'quiz_complete' || !e.properties) return false;
          const props = e.properties as any;
          return typeof props.score === 'number';
        })
        .map(e => (e.properties as any).score as number) || [];
      const avgScore = scoresFromQuiz.length > 0 
        ? Math.round(scoresFromQuiz.reduce((a, b) => a + b, 0) / scoresFromQuiz.length)
        : 0;

      // Calculate conversion rate (quiz to booking)
      const conversionRate = quizCompletions > 0 
        ? Math.round((bookings / quizCompletions) * 100)
        : 0;

      // Calculate yesterday's metrics for comparison
      const yesterdayUniqueSessions = new Set(yesterdayEvents?.map(e => e.session_id) || []).size;
      const yesterdayQuizCompletions = yesterdayEvents?.filter(e => e.event_name === 'quiz_complete').length || 0;
      const yesterdayBookings = yesterdayEvents?.filter(e => e.event_name === 'book_complete').length || 0;
      const yesterdayQuizViews = yesterdayEvents?.filter(e => e.event_name === 'lm_view').length || 0;

      setPreviousMetrics({
        totalEvents: yesterdayEvents?.length || 0,
        activeUsers: yesterdayUniqueSessions,
        quizCompletions: yesterdayQuizCompletions,
        bookings: yesterdayBookings,
        quizViews: yesterdayQuizViews,
        bookViews: yesterdayEvents?.filter(e => e.event_name === 'book_view').length || 0,
        avgClarityScore: 0,
        conversionRate: 0,
      });

      setMetrics({
        totalEvents: todayEvents?.length || 0,
        activeUsers: uniqueSessions,
        quizCompletions,
        bookings,
        quizViews,
        bookViews,
        avgClarityScore: avgScore,
        conversionRate,
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
    <div className="space-y-6">
      {/* Primary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Users Today"
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
          title="Bookings Today"
          value={metrics.bookings}
          icon={<Eye className="h-4 w-4 text-muted-foreground" />}
          change={calculateChange(metrics.bookings, previousMetrics.bookings)}
        />
        <MetricCard
          title="Avg Clarity Score"
          value={metrics.avgClarityScore}
          icon={<Award className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quiz View Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-accent">
              {metrics.quizViews}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.quizCompletions > 0 
                ? `${Math.round((metrics.quizCompletions / metrics.quizViews) * 100)}% completion rate`
                : 'No completions yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-accent">
              {metrics.conversionRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Quiz to booking conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-accent">
              {metrics.totalEvents}
            </div>
            <p className={`text-xs mt-1 ${
              calculateChange(metrics.totalEvents, previousMetrics.totalEvents) >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {calculateChange(metrics.totalEvents, previousMetrics.totalEvents) >= 0 ? '+' : ''}
              {calculateChange(metrics.totalEvents, previousMetrics.totalEvents)}% from yesterday
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};