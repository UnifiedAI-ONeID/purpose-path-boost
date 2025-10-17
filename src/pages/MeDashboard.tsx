import { useEffect, useState } from 'react';
import { usePrefs } from '@/prefs/PrefsProvider';
import { supabase } from '@/integrations/supabase/client';
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

type Summary = {
  ok: boolean;
  profile: { 
    id: string; 
    name?: string | null; 
    email?: string | null;
    avatar_url?: string | null;
    tz?: string | null;
    preferred_currency?: string | null;
  } | null;
  next: { id: string; title: string; start_at: string; end_at: string; join_url: string } | null;
  goals: any[];
  receipts: any[];
  streak: number;
  ref_url: string | null;
};

export default function MeDashboard() {
  const { lang } = usePrefs();
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [lang]);

  async function fetchSummary() {
    setLoading(true);
    try {
      // Get authenticated user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Not authenticated');
      }

      // Fetch user profile first to get profile_id
      const { data: profile, error: profileError } = await supabase
        .from('zg_profiles')
        .select('id, name, email, avatar_url, tz, preferred_currency')
        .eq('auth_user_id', session.user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch next session
      const { data: sessions } = await supabase
        .from('me_sessions')
        .select('*')
        .eq('profile_id', profile.id)
        .gte('start_at', new Date().toISOString())
        .order('start_at', { ascending: true })
        .limit(1);

      // Fetch goals
      const { data: goals } = await supabase
        .from('me_goals')
        .select('*')
        .eq('profile_id', profile.id)
        .order('updated_at', { ascending: false })
        .limit(5);

      // Fetch receipts
      const { data: receipts } = await supabase
        .from('me_receipts')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch referral
      const { data: referral } = await supabase
        .from('zg_referrals')
        .select('ref_code')
        .eq('profile_id', profile.id)
        .maybeSingle();

      // Calculate streak using RPC
      const { data: streakData } = await supabase
        .rpc('get_user_streak', { p_profile_id: profile.id })
        .maybeSingle();

      setData({
        ok: true,
        profile,
        next: sessions?.[0] || null,
        goals: goals || [],
        receipts: receipts || [],
        streak: streakData || 0,
        ref_url: referral?.ref_code 
          ? `https://zhengrowth.com/?ref=${encodeURIComponent(referral.ref_code)}` 
          : null
      });
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function updateGoal(goalId: string, updates: any) {
    try {
      const { error } = await supabase
        .from('me_goals')
        .update(updates)
        .eq('id', goalId);

      if (error) throw error;
      fetchSummary();
      toast.success('Goal updated');
    } catch (error) {
      console.error('Failed to update goal:', error);
      toast.error('Failed to update goal');
    }
  }

  async function createGoal(title: string, due_date?: string) {
    if (!data?.profile?.id) return;

    try {
      const { error } = await supabase
        .from('me_goals')
        .insert([{ profile_id: data.profile.id, title, due_date }]);

      if (error) throw error;
      fetchSummary();
      toast.success('Goal created');
    } catch (error) {
      console.error('Failed to create goal:', error);
      toast.error('Failed to create goal');
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
              <CardDescription>Book a discovery call to get started on your growth journey</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href="/coaching">Explore Coaching</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const next = data.next;

  return (
    <>
      <SEOHelmet
        title="My Dashboard - ZhenGrowth"
        description="Track your personal growth journey and manage your coaching sessions."
      />
      
      {/* In-app nudges */}
      {data.profile && <Nudges profileId={data.profile.id} />}
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-20">
        <div className="container mx-auto max-w-6xl">
          {/* AI Suggested Next Step */}
          {data.profile && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <SuggestedNextStep profileId={data.profile.id} />
            </motion.section>
          )}

          {/* Next Session */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {lang === 'zh-CN' ? '下次会话' : lang === 'zh-TW' ? '下次會話' : 'Next Session'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {next ? (
                  <div>
                    <div className="text-lg font-medium mb-2">{next.title}</div>
                    <div className="text-sm text-muted-foreground mb-4">
                      {new Date(next.start_at).toLocaleString(lang)}
                    </div>
                    <div className="flex gap-2">
                      <Button asChild>
                        <a href={next.join_url} target="_blank" rel="noreferrer">
                          {lang === 'zh-CN' ? '加入' : lang === 'zh-TW' ? '加入' : 'Join'}
                        </a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href="/coaching">
                          {lang === 'zh-CN' ? '管理' : lang === 'zh-TW' ? '管理' : 'Manage'}
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {lang === 'zh-CN' ? '没有预定的会话' : lang === 'zh-TW' ? '沒有預定的會話' : 'No session scheduled'}
                    </p>
                    <Button asChild>
                      <a href="/coaching">
                        {lang === 'zh-CN' ? '预约会话' : lang === 'zh-TW' ? '預約會話' : 'Book a Session'}
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>

          {/* Streak & Referral */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {lang === 'zh-CN' ? '保持你的连续性' : lang === 'zh-TW' ? '保持你的連續性' : 'Keep Your Streak'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {lang === 'zh-CN' ? '活跃天数' : lang === 'zh-TW' ? '活躍天數' : 'Active Days'}
                    </span>
                    <span className="font-semibold">{data.streak} {lang === 'zh-CN' ? '天' : lang === 'zh-TW' ? '天' : 'days'}</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (data.streak / 30) * 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-primary to-primary/60"
                    />
                  </div>
                </div>

                {data.ref_url && (
                  <div>
                    <div className="text-sm font-medium mb-2">
                      {lang === 'zh-CN' ? '邀请朋友' : lang === 'zh-TW' ? '邀請朋友' : 'Invite a Friend'}
                    </div>
                    <div className="flex gap-2">
                      <input
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-1"
                        readOnly
                        value={data.ref_url}
                        onClick={(e) => e.currentTarget.select()}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(data.ref_url!);
                          toast.success('Copied to clipboard!');
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>

          {/* Goals */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Target className="h-5 w-5" />
                {lang === 'zh-CN' ? '你的目标' : lang === 'zh-TW' ? '你的目標' : 'Your Goals'}
              </h2>
              <Button
                size="sm"
                onClick={() => {
                  const title = prompt(lang === 'zh-CN' ? '输入目标标题' : lang === 'zh-TW' ? '輸入目標標題' : 'Enter goal title');
                  if (title) createGoal(title);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {lang === 'zh-CN' ? '添加目标' : lang === 'zh-TW' ? '添加目標' : 'Add Goal'}
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {data.goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} onUpdate={updateGoal} lang={lang} />
              ))}
              {!data.goals.length && (
                <Card className="md:col-span-2">
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">
                      {lang === 'zh-CN' ? '还没有目标' : lang === 'zh-TW' ? '還沒有目標' : 'No goals yet'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.section>

          {/* Receipts */}
          {data.receipts.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <h2 className="text-xl font-semibold mb-4">
                {lang === 'zh-CN' ? '最近付款' : lang === 'zh-TW' ? '最近付款' : 'Recent Payments'}
              </h2>
              <div className="grid gap-2">
                {data.receipts.map((receipt) => (
                  <Card key={receipt.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <div className="font-medium">
                          {new Intl.NumberFormat(lang, {
                            style: 'currency',
                            currency: receipt.currency
                          }).format(receipt.amount_cents / 100)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(receipt.created_at).toLocaleDateString(lang)}
                        </div>
                      </div>
                      {receipt.description && (
                        <div className="text-sm text-muted-foreground">{receipt.description}</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.section>
          )}

          {/* Account Settings */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {lang === 'zh-CN' ? '账户设置' : lang === 'zh-TW' ? '帳戶設定' : 'Account Settings'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <AvatarUploader
                  profileId={data.profile.id}
                  initialUrl={data.profile.avatar_url}
                  onUpdate={(url) => {
                    setData(prev => prev ? {
                      ...prev,
                      profile: { ...prev.profile, avatar_url: url }
                    } : null);
                  }}
                />

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">
                      {lang === 'zh-CN' ? '名称' : lang === 'zh-TW' ? '名稱' : 'Name'}
                    </Label>
                  <Input
                    id="name"
                    defaultValue={data.profile.name || ''}
                    onBlur={async (e) => {
                      if (!data.profile?.id) return;
                      try {
                        const { error } = await supabase
                          .from('zg_profiles')
                          .update({ name: e.target.value })
                          .eq('id', data.profile.id);
                        
                        if (error) throw error;
                        toast.success(
                          lang === 'zh-CN' ? '已保存' : lang === 'zh-TW' ? '已儲存' : 'Saved'
                        );
                      } catch (error) {
                        toast.error(
                          lang === 'zh-CN' ? '保存失败' : lang === 'zh-TW' ? '儲存失敗' : 'Failed to save'
                        );
                      }
                    }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>
                        {lang === 'zh-CN' ? '时区' : lang === 'zh-TW' ? '時區' : 'Timezone'}
                      </Label>
                      <Select
                        defaultValue={data.profile.tz || 'UTC'}
                        onValueChange={async (value) => {
                          if (!data.profile?.id) return;
                          try {
                            const { error } = await supabase
                              .from('zg_profiles')
                              .update({ tz: value })
                              .eq('id', data.profile.id);
                            
                            if (error) throw error;
                            toast.success(
                              lang === 'zh-CN' ? '已保存' : lang === 'zh-TW' ? '已儲存' : 'Saved'
                            );
                          } catch (error) {
                            toast.error(
                              lang === 'zh-CN' ? '保存失败' : lang === 'zh-TW' ? '儲存失敗' : 'Failed to save'
                            );
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">New York</SelectItem>
                          <SelectItem value="America/Los_Angeles">Los Angeles</SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
                          <SelectItem value="Asia/Hong_Kong">Hong Kong</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>
                        {lang === 'zh-CN' ? '货币' : lang === 'zh-TW' ? '貨幣' : 'Currency'}
                      </Label>
                      <Select
                        defaultValue={data.profile.preferred_currency || 'USD'}
                        onValueChange={async (value) => {
                          if (!data.profile?.id) return;
                          try {
                            const { error } = await supabase
                              .from('zg_profiles')
                              .update({ preferred_currency: value })
                              .eq('id', data.profile.id);
                            
                            if (error) throw error;
                            toast.success(
                              lang === 'zh-CN' ? '已保存' : lang === 'zh-TW' ? '已儲存' : 'Saved'
                            );
                          } catch (error) {
                            toast.error(
                              lang === 'zh-CN' ? '保存失败' : lang === 'zh-TW' ? '儲存失敗' : 'Failed to save'
                            );
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="HKD">HKD</SelectItem>
                          <SelectItem value="SGD">SGD</SelectItem>
                          <SelectItem value="CNY">CNY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Subscription Management */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {lang === 'zh-CN' ? '订阅管理' : lang === 'zh-TW' ? '訂閱管理' : 'Subscription'}
                </CardTitle>
                <CardDescription>
                  {lang === 'zh-CN' ? '管理您的订阅计划' : lang === 'zh-TW' ? '管理您的訂閱計劃' : 'Manage your subscription plan'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full">
                  <a href="/pricing">
                    {lang === 'zh-CN' ? '查看所有计划' : lang === 'zh-TW' ? '查看所有方案' : 'View All Plans'}
                  </a>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <a href="/account/cancel">
                    {lang === 'zh-CN' ? '取消订阅' : lang === 'zh-TW' ? '取消訂閱' : 'Cancel Subscription'}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </div>
    </>
  );
}

function GoalCard({
  goal,
  onUpdate,
  lang
}: {
  goal: any;
  onUpdate: (id: string, updates: any) => void;
  lang: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium flex-1">{goal.title}</div>
          <select
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={goal.status}
            onChange={(e) => onUpdate(goal.id, { status: e.target.value })}
          >
            <option value="active">{lang === 'zh-CN' ? '活跃' : lang === 'zh-TW' ? '活躍' : 'Active'}</option>
            <option value="done">{lang === 'zh-CN' ? '完成' : lang === 'zh-TW' ? '完成' : 'Done'}</option>
            <option value="paused">{lang === 'zh-CN' ? '暂停' : lang === 'zh-TW' ? '暫停' : 'Paused'}</option>
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {lang === 'zh-CN' ? '进度' : lang === 'zh-TW' ? '進度' : 'Progress'}
            </span>
            <span className="font-medium">{goal.progress}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={goal.progress}
            onChange={(e) => onUpdate(goal.id, { progress: Number(e.target.value) })}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        {goal.due_date && (
          <div className="text-xs text-muted-foreground mt-2">
            {lang === 'zh-CN' ? '截止日期' : lang === 'zh-TW' ? '截止日期' : 'Due'}:{' '}
            {new Date(goal.due_date).toLocaleDateString(lang)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
