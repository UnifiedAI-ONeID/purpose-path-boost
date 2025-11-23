import { useEffect, useState, useCallback } from 'react';
import { firestore } from '@/firebase/config';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, TrendingUp, Eye, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  change?: number;
}

interface AnalyticsEvent {
  session_id: string;
  event_name: string;
  properties?: EventProperties;
  created_at: { toDate: () => Date };
}

interface EventProperties {
  score?: number;
  [key: string]: unknown;
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

  const loadMetrics = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayQuery = query(
        collection(firestore, 'analytics_events'),
        where('created_at', '>=', today)
      );
      const yesterdayQuery = query(
        collection(firestore, 'analytics_events'),
        where('created_at', '>=', yesterday),
        where('created_at', '<', today)
      );

      const [todaySnapshot, yesterdaySnapshot] = await Promise.all([
        getDocs(todayQuery),
        getDocs(yesterdayQuery),
      ]);

      const todayEvents = todaySnapshot.docs.map(doc => doc.data() as AnalyticsEvent);
      const yesterdayEvents = yesterdaySnapshot.docs.map(doc => doc.data() as AnalyticsEvent);

      // Calculate today's metrics
      const uniqueSessions = new Set(todayEvents.map(e => e.session_id)).size;
      const quizViews = todayEvents.filter(e => e.event_name === 'lm_view').length;
      const quizCompletions = todayEvents.filter(e => e.event_name === 'quiz_complete').length;
      const bookViews = todayEvents.filter(e => e.event_name === 'book_view').length;
      const bookings = todayEvents.filter(e => e.event_name === 'book_complete').length;
      
      const scoresFromQuiz = todayEvents
        .filter(e => 
          e.event_name === 'quiz_complete' && 
          e.properties && 
          typeof e.properties.score === 'number'
        )
        .map(e => e.properties!.score as number);
      const avgScore = scoresFromQuiz.length > 0 
        ? Math.round(scoresFromQuiz.reduce((a, b) => a + b, 0) / scoresFromQuiz.length)
        : 0;

      const conversionRate = quizCompletions > 0 
        ? Math.round((bookings / quizCompletions) * 100)
        : 0;

      // Calculate yesterday's metrics for comparison
      const yesterdayUniqueSessions = new Set(yesterdayEvents.map(e => e.session_id)).size;
      const yesterdayQuizCompletions = yesterdayEvents.filter(e => e.event_name === 'quiz_complete').length;
      const yesterdayBookings = yesterdayEvents.filter(e => e.event_name === 'book_complete').length;
      const yesterdayQuizViews = yesterdayEvents.filter(e => e.event_name === 'lm_view').length;

      setPreviousMetrics({
        totalEvents: yesterdayEvents.length,
        activeUsers: yesterdayUniqueSessions,
        quizCompletions: yesterdayQuizCompletions,
        bookings: yesterdayBookings,
        quizViews: yesterdayQuizViews,
        bookViews: yesterdayEvents.filter(e => e.event_name === 'book_view').length,
        avgClarityScore: 0, // Not calculated for yesterday
        conversionRate: 0, // Not calculated for yesterday
      });

      setMetrics({
        totalEvents: todayEvents.length,
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
  }, []);

  useEffect(() => {
    loadMetrics();
    const q = query(collection(firestore, "analytics_events"), where("created_at", ">", new Date()));
    const unsubscribe = onSnapshot(q, () => {
        loadMetrics();
    });
    const interval = setInterval(loadMetrics, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [loadMetrics]);


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