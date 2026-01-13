import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, TrendingUp, Target, BookOpen, Lightbulb, ArrowLeft, Home, 
  Sparkles, Award, ChevronRight, Calendar, BarChart3, PieChart, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGoals, GOAL_CATEGORIES } from '@/contexts/GoalContext';
import { useJournal, MOOD_OPTIONS } from '@/contexts/JournalContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface WeeklyData {
  week: string;
  entries: number;
  goalsCompleted: number;
  avgMood: number;
}

export default function Insights() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { goals, getActiveGoals, getCompletedGoals, getGoalsByCategory } = useGoals();
  const { entries, getEntriesByMood, getFavorites } = useJournal();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth', { state: { from: '/insights' } });
    }
  }, [user, navigate]);

  // Calculate insights
  const insights = useMemo(() => {
    const now = new Date();
    const periodStart = new Date();
    
    if (selectedPeriod === 'week') {
      periodStart.setDate(now.getDate() - 7);
    } else if (selectedPeriod === 'month') {
      periodStart.setMonth(now.getMonth() - 1);
    } else {
      periodStart.setFullYear(2020); // All time
    }

    // Filter by period
    const periodEntries = entries.filter(e => new Date(e.createdAt) >= periodStart);
    const periodGoals = goals.filter(g => new Date(g.createdAt) >= periodStart);
    const completedInPeriod = periodGoals.filter(g => g.completed);

    // Mood analysis
    const moodCounts = MOOD_OPTIONS.reduce((acc, m) => {
      acc[m.value] = periodEntries.filter(e => e.mood === m.value).length;
      return acc;
    }, {} as Record<string, number>);

    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

    // Category analysis
    const categoryStats = GOAL_CATEGORIES.map(cat => ({
      ...cat,
      total: getGoalsByCategory(cat.value).length,
      completed: getGoalsByCategory(cat.value).filter(g => g.completed).length
    })).filter(c => c.total > 0);

    // Streak calculation
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].createdAt).toDateString();
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (entryDate === expectedDate.toDateString()) {
        tempStreak++;
        if (i === 0 || tempStreak > currentStreak) {
          currentStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
      maxStreak = Math.max(maxStreak, tempStreak);
    }

    // Weekly trend data
    const weeklyData: WeeklyData[] = [];
    for (let w = 0; w < 4; w++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (7 * (w + 1)));
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (7 * w));
      
      const weekEntries = entries.filter(e => {
        const d = new Date(e.createdAt);
        return d >= weekStart && d < weekEnd;
      });

      const weekGoals = goals.filter(g => {
        const d = new Date(g.updatedAt);
        return g.completed && d >= weekStart && d < weekEnd;
      });

      const avgMood = weekEntries.length > 0
        ? weekEntries.reduce((acc, e) => {
            const moodIdx = MOOD_OPTIONS.findIndex(m => m.value === e.mood);
            return acc + (4 - moodIdx); // 4=great, 0=struggling
          }, 0) / weekEntries.length
        : 0;

      weeklyData.push({
        week: `Week ${4 - w}`,
        entries: weekEntries.length,
        goalsCompleted: weekGoals.length,
        avgMood: Math.round(avgMood * 10) / 10
      });
    }

    return {
      totalGoals: goals.length,
      activeGoals: getActiveGoals().length,
      completedGoals: getCompletedGoals().length,
      totalEntries: entries.length,
      periodEntries: periodEntries.length,
      periodGoalsCompleted: completedInPeriod.length,
      moodCounts,
      dominantMood,
      categoryStats,
      currentStreak,
      maxStreak,
      favorites: getFavorites().length,
      weeklyData: weeklyData.reverse(),
      completionRate: goals.length > 0 
        ? Math.round((getCompletedGoals().length / goals.length) * 100) 
        : 0
    };
  }, [goals, entries, selectedPeriod, getActiveGoals, getCompletedGoals, getGoalsByCategory, getFavorites]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-jade-900 to-jade-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="py-12 text-center text-white">
            <Brain className="h-16 w-16 mx-auto mb-4 text-gold-400" />
            <h2 className="text-2xl font-bold mb-2">Sign in to view insights</h2>
            <p className="text-white/70 mb-6">Discover patterns and track your growth</p>
            <Button onClick={() => navigate('/auth')} className="bg-gold-500 hover:bg-gold-600 text-jade-900">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-jade-900 via-jade-800 to-jade-700">
      {/* Header */}
      <div className="bg-jade-900/50 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Brain className="h-6 w-6 text-gold-400" />
                Insights
              </h1>
              <p className="text-sm text-white/60">Track your growth journey</p>
            </div>
          </div>
          {/* Period Selector */}
          <div className="flex gap-1 bg-white/10 rounded-lg p-1">
            {(['week', 'month', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={cn(
                  "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                  selectedPeriod === period
                    ? "bg-gold-500 text-jade-900"
                    : "text-white/70 hover:text-white"
                )}
              >
                {period === 'week' ? '7D' : period === 'month' ? '30D' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <Activity className="h-6 w-6 mx-auto mb-2 text-gold-400" />
              <div className="text-2xl font-bold text-white">{insights.currentStreak}</div>
              <div className="text-xs text-white/60">Day Streak</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-emerald-400" />
              <div className="text-2xl font-bold text-white">{insights.completionRate}%</div>
              <div className="text-xs text-white/60">Goals Complete</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-blue-400" />
              <div className="text-2xl font-bold text-white">{insights.totalEntries}</div>
              <div className="text-xs text-white/60">Journal Entries</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <Award className="h-6 w-6 mx-auto mb-2 text-purple-400" />
              <div className="text-2xl font-bold text-white">{insights.maxStreak}</div>
              <div className="text-xs text-white/60">Best Streak</div>
            </CardContent>
          </Card>
        </div>

        {/* Mood Overview */}
        <Card className="bg-white border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-jade-800 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold-500" />
              Mood Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOOD_OPTIONS.map((mood) => {
                const count = insights.moodCounts[mood.value] || 0;
                const percentage = insights.totalEntries > 0 
                  ? Math.round((count / insights.totalEntries) * 100) 
                  : 0;
                return (
                  <div key={mood.value} className="flex items-center gap-3">
                    <span className="text-xl w-8">{mood.emoji}</span>
                    <span className="w-20 text-sm text-gray-600">{mood.label}</span>
                    <div className="flex-1">
                      <Progress 
                        value={percentage} 
                        className={cn(
                          "h-3",
                          mood.value === 'great' && "[&>div]:bg-green-500",
                          mood.value === 'good' && "[&>div]:bg-emerald-500",
                          mood.value === 'neutral' && "[&>div]:bg-gray-400",
                          mood.value === 'low' && "[&>div]:bg-amber-500",
                          mood.value === 'struggling' && "[&>div]:bg-red-500"
                        )}
                      />
                    </div>
                    <span className="w-12 text-right text-sm font-medium text-gray-700">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
            {insights.dominantMood && insights.dominantMood[1] > 0 && (
              <div className="mt-4 p-3 bg-jade-50 rounded-lg">
                <p className="text-sm text-jade-700">
                  <Lightbulb className="inline h-4 w-4 mr-1 text-gold-500" />
                  Your dominant mood is <strong>{insights.dominantMood[0]}</strong> with {insights.dominantMood[1]} entries.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals by Category */}
        {insights.categoryStats.length > 0 && (
          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-jade-800 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-gold-500" />
                Goals by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {insights.categoryStats.map((cat) => (
                  <div 
                    key={cat.value} 
                    className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{cat.emoji}</span>
                      <span className="font-medium text-gray-800">{cat.label}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>{cat.completed} / {cat.total} completed</span>
                      <span className="font-medium">
                        {cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={cat.total > 0 ? (cat.completed / cat.total) * 100 : 0} 
                      className="h-2 [&>div]:bg-jade-500"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Trend */}
        <Card className="bg-white border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-jade-800 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gold-500" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {insights.weeklyData.map((week, i) => {
                const barHeight = Math.min(week.entries * 10, 100);
                return (
                  <div key={i} className="text-center">
                    <div className="text-xs text-gray-500 mb-2">{week.week}</div>
                    <div className="h-24 flex flex-col justify-end gap-1">
                      <div 
                        className={cn(
                          "bg-blue-400 rounded-t mx-auto w-8",
                          barHeight >= 100 && "h-full",
                          barHeight >= 80 && barHeight < 100 && "h-4/5",
                          barHeight >= 60 && barHeight < 80 && "h-3/5",
                          barHeight >= 40 && barHeight < 60 && "h-2/5",
                          barHeight >= 20 && barHeight < 40 && "h-1/5",
                          barHeight > 0 && barHeight < 20 && "h-2",
                          barHeight === 0 && "h-1"
                        )}
                        title={`${week.entries} entries`}
                      />
                    </div>
                    <div className="mt-2 text-sm font-medium text-gray-700">{week.entries}</div>
                    <div className="text-xs text-gray-500">entries</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="bg-gradient-to-br from-jade-600 to-jade-700 border-none cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => navigate('/goals')}
          >
            <CardContent className="py-6 text-center text-white">
              <Target className="h-8 w-8 mx-auto mb-2" />
              <h3 className="font-semibold">View Goals</h3>
              <p className="text-sm text-white/70">{insights.activeGoals} active</p>
            </CardContent>
          </Card>
          <Card 
            className="bg-gradient-to-br from-gold-500 to-gold-600 border-none cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => navigate('/journal')}
          >
            <CardContent className="py-6 text-center text-jade-900">
              <BookOpen className="h-8 w-8 mx-auto mb-2" />
              <h3 className="font-semibold">View Journal</h3>
              <p className="text-sm text-jade-900/70">{insights.totalEntries} entries</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}