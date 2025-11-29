import { useState, useEffect } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/config';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';

// Firebase callable functions
const referralsOverviewFn = httpsCallable(functions, 'admin-referrals-overview');
const referralsSettingsFn = httpsCallable(functions, 'admin-referrals-settings');
const referralsCreateFn = httpsCallable(functions, 'admin-referrals-create');

// Type definitions
interface ReferralSettings {
  friend_percent_off: number;
  referrer_percent_off: number;
  coupon_expiry_days: number;
}

interface LeaderboardEntry {
  profile_id: string;
  total: number;
}

interface InviteResult {
  ok: boolean;
  link: string;
  friend_coupon: string;
  expires_at: string;
  error?: string;
}

export default function ReferralsManager() {
  const [settings, setSettings] = useState<ReferralSettings>({
    friend_percent_off: 20,
    referrer_percent_off: 20,
    coupon_expiry_days: 7
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [email, setEmail] = useState('');
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const result = await referralsOverviewFn();
      const data = result.data as any;
      setSettings(data?.settings || settings);
      setLeaderboard(data?.leaderboard || []);
    } catch (error) {
      console.error('[ReferralsManager] Fetch failed:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings() {
    try {
      await referralsSettingsFn(settings);
      toast.success('Settings saved');
    } catch (error) {
      console.error('[ReferralsManager] Save failed:', error);
      toast.error('Failed to save settings');
    }
  }

  async function handleCreateInvite() {
    if (!email) {
      toast.error('Email required');
      return;
    }

    try {
      const result = await referralsCreateFn({ email });
      const data = result.data as InviteResult;

      if (!data?.ok) {
        toast.error(data?.error || 'Failed to create invite');
        return;
      }

      setInviteResult(data);
      setEmail('');
      toast.success('Invite created!');
    } catch (error) {
      console.error('[ReferralsManager] Create invite failed:', error);
      toast.error('Failed to create invite');
    }
  }

  function copyLink() {
    if (inviteResult?.link) {
      navigator.clipboard.writeText(inviteResult.link);
      toast.success('Link copied!');
    }
  }

  if (loading) {
    return <AdminShell><div className="p-6">Loading...</div></AdminShell>;
  }

  return (
    <AdminShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Referrals</h1>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Settings Card */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Referral Settings</h3>
            <div className="space-y-4">
              <div>
                <Label>Friend % Off</Label>
                <Input
                  type="number"
                  value={settings.friend_percent_off}
                  onChange={(e) => setSettings({ ...settings, friend_percent_off: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Referrer % Off</Label>
                <Input
                  type="number"
                  value={settings.referrer_percent_off}
                  onChange={(e) => setSettings({ ...settings, referrer_percent_off: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Coupon Expiry (days)</Label>
                <Input
                  type="number"
                  value={settings.coupon_expiry_days}
                  onChange={(e) => setSettings({ ...settings, coupon_expiry_days: Number(e.target.value) })}
                />
              </div>
              <Button onClick={handleSaveSettings} className="w-full">
                Save Settings
              </Button>
            </div>
          </Card>

          {/* Quick Invite Card */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Create Invite for Client</h3>
            <div className="space-y-4">
              <div>
                <Label>Client Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@email.com"
                />
              </div>
              <Button onClick={handleCreateInvite} className="w-full">
                Generate Invite
              </Button>

              {inviteResult?.ok && (
                <Card className="p-4 bg-muted/50">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Invite Link:</span>
                      <Button size="sm" variant="ghost" onClick={copyLink}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <a
                      href={inviteResult.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline block break-all"
                    >
                      {inviteResult.link}
                    </a>
                    <div className="pt-2 border-t">
                      <div>Friend Coupon: <strong>{inviteResult.friend_coupon}</strong></div>
                      <div className="text-muted-foreground">
                        Expires {new Date(inviteResult.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Top Referrers</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile ID</TableHead>
                  <TableHead>Total Referrals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((row) => (
                  <TableRow key={row.profile_id}>
                    <TableCell className="font-mono text-sm">{row.profile_id}</TableCell>
                    <TableCell>{row.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
