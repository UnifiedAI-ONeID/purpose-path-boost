import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SmartLink from '@/components/SmartLink';
import { usePWA } from '../core/PWAProvider';
import { GuestPrompt } from '../core/GuestPrompt';
import { supabase } from '@/integrations/supabase/client';
import {
  User, Target, Calendar, TrendingUp, Award,
  Settings, LogOut, Sparkles, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function MeDashboard() {
  const { user, isGuest, profileId, isOnline } = usePWA();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isGuest && isOnline) {
      fetchSummary();
    } else {
      setLoading(false);
    }
  }, [isGuest, isOnline]);

  const fetchSummary = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('pwa-me-summary');
      if (!error && data?.ok) {
        setSummary(data);
      }
    } catch (err) {
      console.error('[Dashboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      navigate('/pwa');
    } catch (err) {
      toast.error('Failed to sign out');
    }
  };

  if (isGuest) {
    return (
      <div className="p-4">
        <GuestPrompt
          feature="Dashboard"
          description="Track your progress, view insights, and manage your account with a personalized dashboard."
        />
      </div>
    );
  }

  const quickActions = [
    {
      icon: Target,
      label: 'My Goals',
      to: '/pwa/goals',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Calendar,
      label: 'Sessions',
      to: '/pwa/sessions',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: TrendingUp,
      label: 'Analytics',
      to: '/pwa/analytics',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Settings,
      label: 'Settings',
      to: '/pwa/settings',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      {/* Profile Header */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
            {user?.email?.[0].toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user?.email || 'User'}</h2>
            <p className="text-sm text-muted-foreground">
              Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Stats */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-primary mb-1">
              {summary.streak || 0}
            </div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-primary mb-1">
              {summary.goals_completed || 0}
            </div>
            <div className="text-xs text-muted-foreground">Goals Done</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-primary mb-1">
              {summary.lessons_watched || 0}
            </div>
            <div className="text-xs text-muted-foreground">Lessons</div>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.to} className="group hover:shadow-lg transition-shadow">
                <SmartLink to={action.to} className="p-4 flex flex-col items-center gap-3 text-center">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-sm">{action.label}</span>
                </SmartLink>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      {summary?.recent_goals && summary.recent_goals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            Recent Activity
            <Badge variant="secondary">{summary.recent_goals.length}</Badge>
          </h3>
          <div className="space-y-2">
            {summary.recent_goals.slice(0, 3).map((goal: any) => (
              <Card key={goal.id} className="p-3">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{goal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(goal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {goal.completed && (
                    <Badge variant="outline" className="text-green-500 border-green-500">
                      Done
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade CTA */}
      <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="flex items-start gap-3">
          <Sparkles className="h-6 w-6 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Unlock Premium Features</h3>
            <p className="text-sm opacity-90 mb-4">
              Get unlimited goals, advanced analytics, and priority coaching
            </p>
            <Button variant="secondary" size="sm" asChild>
              <SmartLink to="/pwa/coaching">
                Explore Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </SmartLink>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
