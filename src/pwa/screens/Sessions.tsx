import { GuestPrompt } from '../core/GuestPrompt';
import { usePWA } from '../core/PWAProvider';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function Sessions() {
  const { isGuest } = usePWA();

  if (isGuest) {
    return (
      <div className="p-4">
        <GuestPrompt feature="Sessions" description="View and manage your coaching sessions." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
        <Calendar className="h-8 w-8 text-primary" />
        My Sessions
      </h1>
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Sessions coming soon</p>
      </Card>
    </div>
  );
}
