import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SmartLink from '@/components/SmartLink';
import { SEOHelmet } from '@/components/SEOHelmet';
import { usePWA } from '../core/PWAProvider';
import { 
  Target, Brain, GraduationCap, Calendar, 
  TrendingUp, Sparkles, ArrowRight 
} from 'lucide-react';
import { usePrefs } from '@/prefs/PrefsProvider';

export default function EnhancedHome() {
  const { lang } = usePrefs();
  const { user, isGuest, bootData, isOnline } = usePWA();
  const [quickStats, setQuickStats] = useState<any>(null);

  const heroTitle = bootData?.hero?.title_en || 'Grow with Clarity';
  const heroSubtitle = 'Your personal growth companion';

  // Fetch quick stats for authenticated users
  useEffect(() => {
    if (!isGuest && isOnline) {
      import('@/lib/supabase').then(({ dbClient: supabase }) => {
        supabase.functions.invoke('pwa-me-summary').then(({ data }) => {
          if (data?.ok) setQuickStats(data);
        });
      });
    }
  }, [isGuest, isOnline]);

  const features = [
    {
      icon: Target,
      title: 'Daily Goals',
      description: 'Track and achieve your objectives',
      to: '/pwa/goals',
      color: 'from-blue-500 to-cyan-500',
      requiresAuth: true
    },
    {
      icon: GraduationCap,
      title: 'Learn & Grow',
      description: 'Access curated lessons and content',
      to: '/pwa/content',
      color: 'from-purple-500 to-pink-500',
      requiresAuth: false
    },
    {
      icon: Brain,
      title: 'AI Coach',
      description: 'Get personalized insights and suggestions',
      to: '/pwa/ai',
      color: 'from-orange-500 to-red-500',
      requiresAuth: false
    },
    {
      icon: Calendar,
      title: 'Coaching Sessions',
      description: 'Book 1-on-1 coaching calls',
      to: '/pwa/coaching',
      color: 'from-green-500 to-emerald-500',
      requiresAuth: false
    },
    {
      icon: TrendingUp,
      title: 'Progress Analytics',
      description: 'Visualize your growth journey',
      to: '/pwa/analytics',
      color: 'from-indigo-500 to-blue-500',
      requiresAuth: true
    }
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <SEOHelmet
        title="ZhenGrowth PWA - Grow with Clarity"
        description="Your personal growth companion with AI coaching, goal tracking, and curated content."
        path="/pwa"
        lang={lang as 'en'|'zh-CN'|'zh-TW'}
      />

      {/* Hero Card */}
      <Card className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground border-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5" />
            <Badge variant="secondary" className="text-xs">
              {isGuest ? 'Guest Mode' : 'Welcome back'}
            </Badge>
          </div>
          <h1 className="text-4xl font-bold mb-2">{heroTitle}</h1>
          <p className="text-lg opacity-90 mb-6">{heroSubtitle}</p>
          
          {isGuest ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" variant="secondary" asChild>
                <SmartLink to="/auth">
                  Sign In
                </SmartLink>
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                <SmartLink to="/pwa/quiz">
                  Take Assessment
                </SmartLink>
              </Button>
            </div>
          ) : (
            <Button size="lg" variant="secondary" asChild>
              <SmartLink to="/pwa/me">
                View Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </SmartLink>
            </Button>
          )}
        </div>
      </Card>

      {/* Quick Stats for Authenticated Users */}
      {!isGuest && quickStats && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {quickStats.streak || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Day Streak</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {quickStats.goals_completed || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Goals Done</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {quickStats.lessons_watched || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Lessons</div>
          </Card>
        </div>
      )}

      {/* Features Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Explore Features</h2>
        <div className="grid gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isLocked = feature.requiresAuth && isGuest;
            
            return (
              <Card 
                key={feature.to}
                className="group relative overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <SmartLink
                  to={feature.to}
                  className="flex items-center gap-4 p-5"
                >
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                      {isLocked && <span className="ml-2 text-xs text-muted-foreground">🔒</span>}
                    </h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </SmartLink>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA for Guests */}
      {isGuest && (
        <Card className="p-6 bg-muted/50 text-center">
          <h3 className="font-semibold mb-2">Unlock Full Experience</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sign in to track goals, save progress, and get personalized coaching
          </p>
          <Button asChild>
            <SmartLink to="/auth">
              Get Started Free
            </SmartLink>
          </Button>
        </Card>
      )}

      {/* Offline Notice */}
      {!isOnline && (
        <Card className="p-4 bg-orange-500/10 border-orange-500/20">
          <p className="text-sm text-center text-orange-600 dark:text-orange-400">
            You're offline. Some features may be limited.
          </p>
        </Card>
      )}
    </div>
  );
}
