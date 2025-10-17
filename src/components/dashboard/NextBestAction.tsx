import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { UserAnalytics } from '@/hooks/useUserAnalytics';

type NextBestActionProps = {
  analytics: UserAnalytics;
};

export default function NextBestAction({ analytics }: NextBestActionProps) {
  const action = analytics.next_best_action;

  if (!action || !action.title) return null;

  return (
    <Card className="border-primary/40 bg-gradient-to-br from-background to-primary/5">
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground mb-2">Next best action</div>
        <div className="text-lg font-semibold mb-1">{action.title}</div>
        <div className="text-xs text-muted-foreground mb-4">{action.reason}</div>
        <Button asChild className="group">
          <a href={action.href}>
            {action.cta}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
