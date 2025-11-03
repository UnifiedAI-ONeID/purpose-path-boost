import { GuestPrompt } from '../core/GuestPrompt';
import { usePWA } from '../core/PWAProvider';
import { Card } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  const { isGuest } = usePWA();

  if (isGuest) {
    return (
      <div className="p-4">
        <GuestPrompt feature="Settings" description="Manage your account preferences and settings." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
        <SettingsIcon className="h-8 w-8 text-primary" />
        Settings
      </h1>
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Settings coming soon</p>
      </Card>
    </div>
  );
}
