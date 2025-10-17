import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';

export default function System() {
  const [msg, setMsg] = useState('');
  const [bumping, setBumping] = useState(false);
  const [alerting, setAlerting] = useState(false);

  async function handleBumpVersion() {
    setBumping(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        toast.error('Not authenticated');
        return;
      }

      const { error } = await supabase.functions.invoke('api-admin-bump-version', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });

      if (error) throw error;
      toast.success('Cache/version bumped - clients will refresh');
    } catch (error) {
      console.error('[System] Bump failed:', error);
      toast.error('Failed to bump version');
    } finally {
      setBumping(false);
    }
  }

  async function handleSEOAlert() {
    if (!msg.trim()) {
      toast.error('Please enter an alert message');
      return;
    }

    setAlerting(true);
    try {
      const { error } = await supabase
        .from('nudge_inbox')
        .insert([{
          profile_id: null,
          kind: 'banner',
          title: 'SEO Update',
          body: msg,
          expire_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }]);

      if (error) throw error;
      setMsg('');
      toast.success('SEO alert queued');
    } catch (error) {
      console.error('[System] Alert failed:', error);
      toast.error('Failed to queue alert');
    } finally {
      setAlerting(false);
    }
  }

  return (
    <AdminShell>
    <div className="space-y-4 max-w-2xl">
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Source-of-Truth · Cache</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Bump the content version to force all clients to refresh their cached content.
        </p>
        <Button onClick={handleBumpVersion} disabled={bumping}>
          {bumping ? 'Bumping...' : 'Bump Version / Force Refresh'}
        </Button>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">SEO Alert System</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Notify admins when Google/Baidu change major SEO guidance.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., Title length change; roll update"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSEOAlert} disabled={alerting}>
            {alerting ? 'Sending...' : 'Queue Alert'}
          </Button>
        </div>
      </Card>
    </div>
    </AdminShell>
  );
}
