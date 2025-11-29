import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/db';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';
import { adminService } from '@/services/admin';

export default function Integrations() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [secrets, setSecrets] = useState({
    airwallex_api_key: '',
    cal_com_api_key: '',
  });

  useEffect(() => {
    loadSecrets();
  }, []);

  async function loadSecrets() {
    setLoading(true);
    try {
      const fetchedSecrets = await adminService.getSecrets();
      setSecrets(s => ({ ...s, ...fetchedSecrets }));
    } catch (error) {
      console.error('[Integrations] Load failed:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await adminService.saveSecrets(secrets);
      toast.success('API keys saved securely');
      setSecrets({ airwallex_api_key: '', cal_com_api_key: '' });
    } catch (error) {
      console.error('[Integrations] Save failed:', error);
      toast.error('Failed to save API keys');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminShell>
        <Card className="p-6 max-w-xl">
          <div className="text-center">Loading...</div>
        </Card>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <Card className="p-6 max-w-xl">
        <h2 className="text-xl font-semibold mb-4">API Keys & Integrations</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="airwallex">Airwallex API Key</Label>
            <Input
              id="airwallex_api_key"
              type="password"
              value={secrets.airwallex_api_key}
              onChange={(e) => setSecrets({ ...secrets, airwallex_api_key: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <div>
            <Label htmlFor="calcom">Cal.com API Key</Label>
            <Input
              id="cal_com_api_key"
              type="password"
              value={secrets.cal_com_api_key}
              onChange={(e) => setSecrets({ ...secrets, cal_com_api_key: e.target.value })}
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
