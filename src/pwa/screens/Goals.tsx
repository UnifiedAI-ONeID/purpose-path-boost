import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { usePWA } from '../core/PWAProvider';
import { GuestPrompt } from '../core/GuestPrompt';
import { supabase } from '@/integrations/supabase/client';
import { Target, Plus, Check, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Goal {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
}

export default function Goals() {
  const { isGuest, isOnline } = usePWA();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isGuest && isOnline) {
      fetchGoals();
    } else {
      setLoading(false);
    }
  }, [isGuest, isOnline]);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('pwa-me-goals', {
        method: 'GET'
      });
      
      if (!error && data?.ok) {
        setGoals(data.goals || []);
      }
    } catch (err) {
      console.error('[Goals] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async () => {
    if (!newGoal.trim()) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('pwa-me-goals', {
        method: 'POST',
        body: {
          title: newGoal,
          priority: 'medium'
        }
      });
      
      if (!error && data?.ok) {
        setGoals([...goals, data.goal]);
        setNewGoal('');
        toast.success('Goal added!');
      }
    } catch (err) {
      toast.error('Failed to add goal');
    }
  };

  const toggleGoal = async (goalId: string, completed: boolean) => {
    try {
      const { data, error } = await supabase.functions.invoke('pwa-me-goals', {
        method: 'PATCH',
        body: {
          goal_id: goalId,
          completed: !completed
        }
      });
      
      if (!error && data?.ok) {
        setGoals(goals.map(g => 
          g.id === goalId ? { ...g, completed: !completed } : g
        ));
        if (!completed) {
          toast.success('Goal completed! 🎉');
        }
      }
    } catch (err) {
      toast.error('Failed to update goal');
    }
  };

  if (isGuest) {
    return (
      <div className="p-4">
        <GuestPrompt 
          feature="Goals" 
          description="Track your daily objectives and celebrate your progress with personalized goal tracking."
        />
      </div>
    );
  }

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Target className="h-8 w-8 text-primary" />
          My Goals
        </h1>
        <p className="text-muted-foreground">
          Track and achieve your daily objectives
        </p>
      </div>

      {/* Add Goal */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="What do you want to achieve today?"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGoal()}
            className="flex-1"
          />
          <Button onClick={addGoal} disabled={!newGoal.trim() || !isOnline}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            Active Goals
            <Badge variant="secondary">{activeGoals.length}</Badge>
          </h2>
          <div className="space-y-2">
            {activeGoals.map((goal) => (
              <Card key={goal.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={goal.completed}
                    onCheckedChange={() => toggleGoal(goal.id, goal.completed)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{goal.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(goal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      goal.priority === 'high' ? 'destructive' : 
                      goal.priority === 'medium' ? 'default' : 'secondary'
                    }
                  >
                    {goal.priority}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            Completed
            <Badge variant="outline">{completedGoals.length}</Badge>
          </h2>
          <div className="space-y-2">
            {completedGoals.map((goal) => (
              <Card key={goal.id} className="p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="font-medium line-through opacity-60">{goal.title}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && goals.length === 0 && (
        <Card className="p-12 text-center">
          <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No goals yet</h3>
          <p className="text-muted-foreground">
            Start by adding your first goal above
          </p>
        </Card>
      )}
    </div>
  );
}
