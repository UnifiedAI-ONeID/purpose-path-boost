/**
 * @file Analytics PWA Screen - Progress tracking and insights visualization
 * Uses Jade & Gold design system
 */

import { useState, useMemo } from 'react';
import { GuestPrompt } from '../core/GuestPrompt';
import { usePWA } from '../core/PWAProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, Target, BookOpen, Award, Calendar, BarChart3, 
  Flame, Sparkles, ChevronRight, Smile, Frown, Meh, Heart
} from 'lucide-react';
import { useGoals, GOAL_CATEGORIES } from '@/contexts/GoalContext';
import { useJournal, MOOD_OPTIONS } from '@/contexts/JournalContext';
import { cn } from '@/lib/utils';

export default function Analytics() {
  const { isGuest } = usePWA();
  const { goals, getActiveGoals, getCompletedGoals, getGoalsByCategory } = useGoals();
  const { entries, getFavorites } = useJournal();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');

  // Calculate insights
  const insights = useMemo(() => {
    const now = new Date();
    const periodStart = new Date();
    
    if (selectedPeriod === 'week') {
      periodStart.setDate(now.getDate() - 7);
    } else if (selectedPeriod === 'month') {
      periodStart.setMonth(now.getMonth() - 1);
    } else {
      periodStart.setFullYear(2020);
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

    // Category stats
    const categoryStats = GOAL_CATEGORIES.map(cat => ({
      ...cat,
      total: getGoalsByCategory(cat.value).length,
      completed: getGoalsByCategory(cat.value).filter(g => g.completed).length
    })).filter(c => c.total > 0);

    // Streak calculation
    let currentStreak = 0;
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].createdAt).toDateString();
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      if (entryDate === expectedDate.toDateString()) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      totalGoals: goals.length,
      activeGoals: getActiveGoals().length,
      completedGoals: getCompletedGoals().length,
      completionRate: goals.length > 0 
        ? Math.round((getCompletedGoals().length / goals.length) * 100) 
        : 0,
      totalEntries: entries.length,
      periodEntries: periodEntries.length,
      favorites: getFavorites().length,
      dominantMood,
      moodCounts,
      categoryStats,
      currentStreak
    };
  }, [goals, entries, selectedPeriod, getActiveGoals, getCompletedGoals, getGoalsByCategory, getFavorites]);

  if (isGuest) {
    return (
      <div className="p-4">
        <GuestPrompt feature="Analytics" description="Track your progress with detailed insights and visualizations." />
      </div>
    );
  }

  // Get mood icon
  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'great': return <Sparkles className="h-5 w-5 text-green-500" />;
      case 'good': return <Smile className="h-5 w-5 text-emerald-500" />;
      case 'okay': return <Meh className="h-5 w-5 text-yellow-500" />;
      case 'low': return <Frown className="h-5 w-5 text-orange-500" />;
      case 'rough': return <Heart className="h-5 w-5 text-rose-500" />;
      default: return <Meh className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-jade-900 via-jade-800 to-jade-700">
      {/* Header */}
      <div className="bg-jade-900/50 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-gold-400" />
            Your Progress
          </h1>
          <p className="text-sm text-white/60 mt-1">Track your growth journey</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Period Selector */}
        <div className="flex gap-2">
          {(['week', 'month', 'all'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
              className={cn(
                selectedPeriod === period 
                  ? 'bg-gold-500 hover:bg-gold-600 text-jade-900' 
                  : 'border-white/20 text-white/80 hover:bg-white/10'
              )}
            >
              {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
            </Button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <Flame className="h-6 w-6 mx-auto mb-2 text-orange-400" />
              <div className="text-3xl font-bold text-white">{insights.currentStreak}</div>
              <div className="text-xs text-white/60">Day Streak</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-gold-400" />
              <div className="text-3xl font-bold text-white">{insights.completionRate}%</div>
              <div className="text-xs text-white/60">Goal Completion</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-emerald-400" />
              <div className="text-3xl font-bold text-white">{insights.totalEntries}</div>
              <div className="text-xs text-white/60">Journal Entries</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <Award className="h-6 w-6 mx-auto mb-2 text-amber-400" />
              <div className="text-3xl font-bold text-white">{insights.completedGoals}</div>
              <div className="text-xs text-white/60">Goals Achieved</div>
            </CardContent>
          </Card>
        </div>

        {/* Goals Progress */}
        <Card className="bg-white border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-jade-800 flex items-center gap-2">
              <Target className="h-5 w-5 text-gold-500" />
              Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">
                {insights.completedGoals} of {insights.totalGoals} completed
              </span>
              <span className="font-semibold text-jade-700">{insights.completionRate}%</span>
            </div>
            <Progress value={insights.completionRate} className="h-3" />
            
            {/* Category Breakdown */}
            {insights.categoryStats.length > 0 && (
              <div className="pt-4 space-y-3">
                <h4 className="font-medium text-gray-700">By Category</h4>
                {insights.categoryStats.map((cat) => (
                  <div key={cat.value} className="flex items-center gap-3">
                    <span className="text-xl">{cat.emoji}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{cat.label}</span>
                        <span className="text-gray-500">{cat.completed}/{cat.total}</span>
                      </div>
                      <Progress 
                        value={cat.total > 0 ? (cat.completed / cat.total) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mood Overview */}
        <Card className="bg-white border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-jade-800 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gold-500" />
              Mood Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.dominantMood && insights.dominantMood[1] > 0 ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  {getMoodIcon(insights.dominantMood[0])}
                  <div>
                    <p className="font-medium text-gray-800">
                      Most common: {MOOD_OPTIONS.find(m => m.value === insights.dominantMood[0])?.label || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {insights.dominantMood[1]} entries in this period
                    </p>
                  </div>
                </div>
                
                {/* Mood Distribution */}
                <div className="space-y-2">
                  {MOOD_OPTIONS.map((mood) => {
                    const count = insights.moodCounts[mood.value] || 0;
                    const percentage = insights.periodEntries > 0 
                      ? Math.round((count / insights.periodEntries) * 100) 
                      : 0;
                    return (
                      <div key={mood.value} className="flex items-center gap-2">
                        <span className="text-lg w-6">{mood.emoji}</span>
                        <div className="flex-1">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-jade-500 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 w-8">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <BookOpen className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p>No journal entries yet</p>
                <p className="text-sm">Start journaling to see mood insights</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-16 border-white/20 text-white hover:bg-white/10 flex-col gap-1"
            onClick={() => window.location.href = '/goals'}
          >
            <Target className="h-5 w-5 text-gold-400" />
            <span>View Goals</span>
          </Button>
          <Button
            variant="outline"
            className="h-16 border-white/20 text-white hover:bg-white/10 flex-col gap-1"
            onClick={() => window.location.href = '/journal'}
          >
            <BookOpen className="h-5 w-5 text-emerald-400" />
            <span>View Journal</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
