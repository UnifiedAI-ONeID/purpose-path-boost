import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Calendar, Copy, TrendingUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { auth, db } from '@/firebase/config';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        toast({
          title: 'Not authenticated',
          description: 'Please sign in to view your dashboard',
          variant: 'destructive'
        });
        return;
      }

      try {
        // Fetch user profile from Firestore
        // Path: /users/{uid}
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (!profileSnap.exists()) {
          toast({
            title: 'Profile not found',
            description: 'Please complete your profile setup',
            variant: 'destructive'
          });
          return;
        }

        const profile = { id: profileSnap.id, ...profileSnap.data() };

        // Fetch next session
        // Path: /users/{uid}/sessions
        const sessionsRef = collection(db, 'users', user.uid, 'sessions');
        const q = query(sessionsRef, where('start_at', '>=', new Date().toISOString()), orderBy('start_at', 'asc'), limit(1));
        const sessionsSnap = await getDocs(q);
        const sessions = sessionsSnap.docs.map(d => d.data());

        // Fetch referral
        // Path: /referrals/{id} -> but we need to query by profile_id/user_id? 
        // Or maybe it's under /users/{uid}/referral? 
        // Based on schema: /referrals/{referralId}. We might need an index or store referral code on user doc.
        // For now, assuming we can query referrals by owner.
        const referralsRef = collection(db, 'referrals');
        const refQ = query(referralsRef, where('userId', '==', user.uid), limit(1));
        const refSnap = await getDocs(refQ);
        const referral = refSnap.empty ? null : refSnap.docs[0].data();

        // Calculate streak
        // This was an RPC call. We might need to fetch sessions or rely on a pre-calculated field on user doc.
        // Assuming 'streak' is on user doc for now.
        const streak = (profile as any).streak || 0;
        const streak_pct = Math.min(100, (streak / 30) * 100);

        setData({
          ok: true,
          profile,
          next: sessions?.[0] ? { 
            start: sessions[0].start_at, 
            join_url: sessions[0].join_url 
          } : null,
          streak_pct,
          ref_url: referral?.code 
            ? `https://zhengrowth.com/?ref=${encodeURIComponent(referral.code)}` 
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
    });

    return () => unsubscribe();
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
            <Input readOnly value={data.ref_url || ''} className="flex-1" />
            <Button onClick={copyRefLink} size="icon" disabled={!data.ref_url}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
