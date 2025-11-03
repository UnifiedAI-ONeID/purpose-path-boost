import { GuestPrompt } from '../core/GuestPrompt';
import { usePWA } from '../core/PWAProvider';
import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export default function Analytics() {
  const { isGuest } = usePWA();

  if (isGuest) {
    return (
      <div className="p-4">
        <GuestPrompt feature="Analytics" description="Track your progress with detailed insights and visualizations." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
        <TrendingUp className="h-8 w-8 text-primary" />
        Analytics
      </h1>
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Analytics coming soon</p>
      </Card>
    </div>
  );
}
