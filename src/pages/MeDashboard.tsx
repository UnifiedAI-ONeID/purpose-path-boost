
import { useEffect, useState } from 'react';
import { usePrefs } from '@/prefs/PrefsProvider';
import { db, auth } from '@/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Target, TrendingUp, Share2, Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { SEOHelmet } from '@/components/SEOHelmet';
import AvatarUploader from '@/components/AvatarUploader';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SuggestedNextStep from '@/components/SuggestedNextStep';
import Nudges from '@/components/Nudges';
import { useUserAnalytics } from '@/hooks/useUserAnalytics';
import InsightsMini from '@/components/dashboard/InsightsMini';
import HabitsScore from '@/components/dashboard/HabitsScore';
import NextBestAction from '@/components/dashboard/NextBestAction';
import NpsQuick from '@/components/dashboard/NpsQuick';
import { onAuthStateChanged } from 'firebase/auth';

type Profile = {
  id: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  tz?: string | null;
  preferred_currency?: string | null;
};

type Session = {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  join_url: string;
};

type Goal = {
  id: string;
  title: string;
  status: 'active' | 'done' | 'paused';
  progress: number;
  due_date?: string;
};

type Receipt = {
  id: string;
  amount_cents: number;
  currency: string;
  created_at: string;
  description?: string;
};

type Summary = {
  ok: boolean;
  profile: Profile | null;
  next: Session | null;
  goals: Goal[];
  receipts: Receipt[];
  streak: number;
  ref_url: string | null;
};

export default function MeDashboard() {
  const { lang } = usePrefs();
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const { data: analyticsData } = useUserAnalytics(profileId);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchSummary(user.uid);
      } else {
        setLoading(false);
        setData(null); // Clear data on logout
      }
    });

    return () => unsubscribe();
  }, [lang]);

  async function fetchSummary(authUserId: string) {
    setLoading(true);
    try {
      // 1. Fetch user profile
      const profileQuery = query(collection(db, 'users'), where('auth_user_id', '==', authUserId), limit(1));
      const profileSnapshot = await getDocs(profileQuery);

      if (profileSnapshot.empty) {
        throw new Error('Profile not found.');
      }
      
      const profileDoc = profileSnapshot.docs[0];
      const profile = { id: profileDoc.id, ...profileDoc.data() } as Profile;
      setProfileId(profile.id);

      // 2. Fetch next session
      const sessionsQuery = query(
        collection(db, 'me_sessions'),
        where('profile_id', '==', profile.id),
        where('start_at', '>=', new Date().toISOString()),
        orderBy('start_at', 'asc'),
        limit(1)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const nextSession = sessionsSnapshot.empty ? null : { id: sessionsSnapshot.docs[0].id, ...sessionsSnapshot.docs[0].data() } as Session;

      // 3. Fetch goals
      const goalsQuery = query(
        collection(db, 'me_goals'),
        where('profile_id', '==', profile.id),
        orderBy('updated_at', 'desc'),
        limit(5)
      );
      const goalsSnapshot = await getDocs(goalsQuery);
      const goals = goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Goal[];

      // 4. Fetch receipts
      const receiptsQuery = query(
        collection(db, 'me_receipts'),
        where('profile_id', '==', profile.id),
        orderBy('created_at', 'desc'),
        limit(5)
      );
      const receiptsSnapshot = await getDocs(receiptsQuery);
      const receipts = receiptsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Receipt[];
      
      // 5. Fetch or create referral code
      const referralRef = doc(db, 'zg_referrals', profile.id);
      let referralSnap = await getDoc(referralRef);
      if (!referralSnap.exists()) {
        const refCode = `REF${profile.id.substring(0, 8).toUpperCase()}`;
        await setDoc(referralRef, { profile_id: profile.id, ref_code: refCode, created_at: serverTimestamp() });
        referralSnap = await getDoc(referralRef);
      }
      const referral = referralSnap.data();
      const ref_url = referral?.ref_code ? `https://zhengrowth.com/?ref=${encodeURIComponent(referral.ref_code)}` : null;

      // 6. Calculate streak from journal entries
      const journalQuery = query(
        collection(db, 'me_journal'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(60) // Check last 60 days max
      );
      const journalSnapshot = await getDocs(journalQuery);
      const journalEntries = journalSnapshot.docs.map(doc => doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt));
      
      // Calculate streak
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < 60; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const hasEntry = journalEntries.some(entryDate => {
          const d = new Date(entryDate);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === checkDate.getTime();
        });
        
        if (hasEntry) {
          streak++;
        } else if (i > 0) { // Allow today to be missing
          break;
        }
      }

      setData({
        ok: true,
        profile,
        next: nextSession,
        goals,
        receipts,
        streak,
        ref_url
      });

    } catch (error) {
      console.error('Failed to fetch summary:', error);
      toast.error('Failed to load dashboard. You might need to complete your profile.');
    } finally {
      setLoading(false);
    }
  }

  async function updateGoal(goalId: string, updates: Partial<Goal>) {
    try {
      const goalRef = doc(db, 'me_goals', goalId);
      await updateDoc(goalRef, { ...updates, updated_at: serverTimestamp() });
      
      // Optimistic update
      setData(prevData => {
        if (!prevData) return null;
        const newGoals = prevData.goals.map(g => g.id === goalId ? { ...g, ...updates } : g);
        return { ...prevData, goals: newGoals };
      });

      toast.success('Goal updated');
    } catch (error) {
      console.error('Failed to update goal:', error);
      toast.error('Failed to update goal');
    }
  }

  async function createGoal(title: string, due_date?: string) {
    if (!profileId) return;

    try {
      const newGoal = {
        profile_id: profileId,
        title,
        due_date: due_date || null,
        status: 'active',
        progress: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'me_goals'), newGoal);
      
      // Optimistic update
      setData(prevData => {
        if (!prevData) return null;
        const addedGoal = { ...newGoal, id: docRef.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        return { ...prevData, goals: [addedGoal as Goal, ...prevData.goals] };
      });
      
      toast.success('Goal created');
    } catch (error) {
      console.error('Failed to create goal:', error);
      toast.error('Failed to create goal');
    }
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!profileId) return;
    try {
        const profileRef = doc(db, 'users', profileId);
        await updateDoc(profileRef, updates);
        
        setData(prev => prev ? {
            ...prev,
            profile: prev.profile ? { ...prev.profile, ...updates } : null
        } : null);

        toast.success('Profile updated!');
    } catch (error) {
        console.error('Failed to update profile:', error);
        toast.error('Failed to save profile changes.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.profile) {
    return (
      <>
        <SEOHelmet
          title="My Dashboard - ZhenGrowth"
          description="Track your personal growth journey and manage your coaching sessions."
        />
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Welcome to Your Dashboard</CardTitle>
              <CardDescription>Please log in or sign up to get started on your growth journey.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href="/auth">Login or Sign Up</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const { profile, next, goals, receipts, streak, ref_url } = data;

  return (
    <>
      <SEOHelmet
        title="My Dashboard - ZhenGrowth"
        description="Track your personal growth journey and manage your coaching sessions."
      />
      
      {profileId && <Nudges profileId={profileId} />}
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-20">
        <div className="container mx-auto max-w-6xl">

          {analyticsData && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <InsightsMini analytics={analyticsData} />
            </motion.section>
          )}

          {analyticsData && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid md:grid-cols-2 gap-6 mb-6">
              <HabitsScore score={analyticsData.habits} />
              <NextBestAction analytics={analyticsData} />
            </motion.section>
          )}

          {profileId && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
              <SuggestedNextStep profileId={profileId} />
            </motion.section>
          )}

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Next Session</CardTitle></CardHeader>
              <CardContent>
                {next ? (
                  <div>
                    <div className="text-lg font-medium mb-2">{next.title}</div>
                    <div className="text-sm text-muted-foreground mb-4">{new Date(next.start_at).toLocaleString(lang)}</div>
                    <div className="flex gap-2">
                      <Button asChild><a href={next.join_url} target="_blank" rel="noreferrer">Join</a></Button>
                      <Button variant="outline" asChild><a href="/coaching">Manage</a></Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No session scheduled</p>
                    <Button asChild><a href="/coaching">Book a Session</a></Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>
          
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Keep Your Streak</CardTitle></CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Active Days</span>
                    <span className="font-semibold">{streak} days</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (streak / 30) * 100)}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-primary to-primary/60" />
                  </div>
                </div>
                {ref_url && (
                  <div>
                    <div className="text-sm font-medium mb-2">Invite a Friend</div>
                    <div className="flex gap-2">
                      <Input readOnly value={ref_url} onClick={(e) => e.currentTarget.select()} />
                      <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(ref_url); toast.success('Copied!'); }}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Target className="h-5 w-5" />Your Goals</h2>
              <Button size="sm" onClick={() => { const title = prompt('Enter goal title'); if (title) createGoal(title); }}>
                <Plus className="mr-2 h-4 w-4" />Add Goal
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {goals.map((goal) => <GoalCard key={goal.id} goal={goal} onUpdate={updateGoal} lang={lang} />)}
              {!goals.length && <Card className="md:col-span-2"><CardContent className="text-center py-8"><p className="text-muted-foreground">No goals yet.</p></CardContent></Card>}
            </div>
          </motion.section>

          {profileId && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mb-6">
              <NpsQuick profileId={profileId} />
            </motion.section>
          )}

          {receipts.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Recent Payments</h2>
              <div className="grid gap-2">
                {receipts.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <div className="font-medium">{new Intl.NumberFormat(lang, { style: 'currency', currency: r.currency }).format(r.amount_cents / 100)}</div>
                        <div className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString(lang)}</div>
                      </div>
                      {r.description && <div className="text-sm text-muted-foreground">{r.description}</div>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.section>
          )}

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <Card>
              <CardHeader><CardTitle>Account Settings</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <AvatarUploader profileId={profile.id} initialUrl={profile.avatar_url} onUpdate={(url) => updateProfile({ avatar_url: url })} />
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" defaultValue={profile.name || ''} onBlur={(e) => updateProfile({ name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Timezone</Label>
                      <Select defaultValue={profile.tz || 'UTC'} onValueChange={(v) => updateProfile({ tz: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">New York</SelectItem>
                          <SelectItem value="America/Los_Angeles">Los Angeles</SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <Select defaultValue={profile.preferred_currency || 'USD'} onValueChange={(v) => updateProfile({ preferred_currency: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mb-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>Manage your subscription plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full"><a href="/pricing">View All Plans</a></Button>
                <Button asChild variant="ghost" className="w-full"><a href="/account/cancel">Cancel Subscription</a></Button>
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </div>
    </>
  );
}

function GoalCard({ goal, onUpdate, lang }: { goal: Goal; onUpdate: (id: string, updates: Partial<Goal>) => void; lang: string; }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium flex-1">{goal.title}</div>
          <Select value={goal.status} onValueChange={(status: Goal['status']) => onUpdate(goal.id, { status })}>
            <SelectTrigger className="w-[100px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{goal.progress}%</span>
          </div>
          <Input 
            type="range" 
            min={0} 
            max={100} 
            value={goal.progress} 
            onChange={(e) => onUpdate(goal.id, { progress: Number(e.target.value) })}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
        {goal.due_date && <div className="text-xs text-muted-foreground mt-2">Due: {new Date(goal.due_date).toLocaleDateString(lang)}</div>}
      </CardContent>
    </Card>
  );
}
