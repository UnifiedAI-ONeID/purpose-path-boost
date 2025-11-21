import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Calendar, Copy, TrendingUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { dbClient as supabase } from '@/db';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDashboard() {
      try {
        // Get authenticated user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          toast({
            title: 'Not authenticated',
            description: 'Please sign in to view your dashboard',
            variant: 'destructive'
          });
          return;
        }

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('zg_profiles')
          .select('id, name, email')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        
        if (!profile) {
          toast({
            title: 'Profile not found',
            description: 'Please complete your profile setup',
            variant: 'destructive'
          });
          return;
        }

        // Fetch next session
        const { data: sessions } = await supabase
          .from('me_sessions')
          .select('*')
          .eq('profile_id', profile.id)
          .gte('start_at', new Date().toISOString())
          .order('start_at', { ascending: true })
          .limit(1);

        // Fetch referral
        const { data: referral } = await supabase
          .from('zg_referrals')
          .select('ref_code')
          .eq('profile_id', profile.id)
          .maybeSingle();

        // Calculate streak
        const { data: streakData } = await supabase
          .rpc('get_user_streak', { p_profile_id: profile.id })
          .maybeSingle();

        const streak = streakData || 0;
        const streak_pct = Math.min(100, (streak / 30) * 100);

        setData({
          ok: true,
          profile,
          next: sessions?.[0] ? { 
            start: sessions[0].start_at, 
            join_url: sessions[0].join_url 
          } : null,
          streak_pct,
          ref_url: referral?.ref_code 
            ? `https://zhengrowth.com/?ref=${encodeURIComponent(referral.ref_code)}` 
            : null
        });
      } catch (error) {
        console.error('PWA Dashboard fetch error:', error);
        toast({
          title: 'Error loading dashboard',
          description: 'Please try again later',
          variant: 'destructive'
        });
      }
    }

    fetchDashboard();
  }, [toast]);

  if (!data) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">Loading your dashboard...</div>
      </main>
    );
  }

  const copyRefLink = () => {
    navigator.clipboard.writeText(data.ref_url);
    toast({
      title: 'Copied!',
      description: 'Referral link copied to clipboard'
    });
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">My Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Your Next Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.next ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {new Date(data.next.start).toLocaleString()}
              </p>
              {data.next.join_url && (
                <Button asChild>
                  <a href={data.next.join_url} target="_blank" rel="noopener noreferrer">
                    Join Session
                  </a>
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No upcoming sessions. Book your first session!
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Keep Your Streak
          </CardTitle>
          <CardDescription>Stay engaged with your growth journey</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={data.streak_pct || 0} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {Math.round(data.streak_pct || 0)}% active this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gift Clarity</CardTitle>
          <CardDescription>Share your referral link with friends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input readOnly value={data.ref_url} className="flex-1" />
            <Button onClick={copyRefLink} size="icon">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
