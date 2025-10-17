import { Card, CardContent } from '@/components/ui/card';
import { UserAnalytics } from '@/hooks/useUserAnalytics';

type InsightsMiniProps = {
  analytics: UserAnalytics;
};

export default function InsightsMini({ analytics }: InsightsMiniProps) {
  const MetricCard = ({ 
    label, 
    value, 
    subtitle 
  }: { 
    label: string; 
    value: string | number; 
    subtitle?: string 
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className="text-2xl font-semibold">{value}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard
        label="Streak"
        value={`${analytics.streak} day${analytics.streak === 1 ? '' : 's'}`}
        subtitle="Keep it going"
      />
      <MetricCard
        label="Focus time (7d)"
        value={`${analytics.minutes.d7}m`}
        subtitle={`${analytics.minutes.d30}m (30d)`}
      />
      <MetricCard
        label="Completion rate"
        value={`${analytics.completion.rate}%`}
        subtitle={`${analytics.completion.completes30}/${analytics.completion.starts30} (30d)`}
      />
      <MetricCard
        label="Bookings (mo)"
        value={`${analytics.bookings.month.attended}/${analytics.bookings.month.booked}`}
        subtitle="attended / booked"
      />
    </div>
  );
}
