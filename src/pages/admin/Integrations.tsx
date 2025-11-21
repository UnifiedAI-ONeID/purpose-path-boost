import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';

export default function Integrations() {
  const [saving, setSaving] = useState(false);
  const [secrets, setSecrets] = useState({
    airwallex: '',
    calcom: '',
  });

  async function handleSave() {
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        toast.error('Not authenticated');
        return;
      }

      // Note: In production, you'd call an edge function to securely update secrets
      toast.success('API keys would be saved securely via edge function');
      
      // Clear form
      setSecrets({ airwallex: '', calcom: '' });
    } catch (error) {
      console.error('[Integrations] Save failed:', error);
      toast.error('Failed to save API keys');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
    <Card className="p-6 max-w-xl">
      <h2 className="text-xl font-semibold mb-4">API Keys & Integrations</h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="airwallex">Airwallex API Key</Label>
          <Input
            id="airwallex"
            type="password"
            value={secrets.airwallex}
            onChange={(e) => setSecrets({ ...secrets, airwallex: e.target.value })}
            placeholder="••••••••"
          />
        </div>

        <div>
          <Label htmlFor="calcom">Cal.com API Key</Label>
          <Input
            id="calcom"
            type="password"
            value={secrets.calcom}
            onChange={(e) => setSecrets({ ...secrets, calcom: e.target.value })}
            placeholder="••••••••"
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save API Keys'}
        </Button>
      </div>
    </Card>
    </AdminShell>
  );
}
