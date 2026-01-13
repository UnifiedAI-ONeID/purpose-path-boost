import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Plus, CheckCircle2, Circle, Calendar, Flag, Trash2, ArrowLeft, Home, Edit2, X, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useGoals, Goal, Milestone, GOAL_CATEGORIES, GOAL_PRIORITIES } from '@/contexts/GoalContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface GoalFormData {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  milestones: { title: string }[];
}

export default function Goals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { goals, loading, addGoal, updateGoal, deleteGoal, toggleMilestone, getActiveGoals, getCompletedGoals } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    category: 'personal',
    priority: 'medium',
    dueDate: '',
    milestones: []
  });
  const [newMilestone, setNewMilestone] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { state: { from: '/goals' } });
    }
  }, [user, loading, navigate]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'personal',
      priority: 'medium',
      dueDate: '',
      milestones: []
    });
    setNewMilestone('');
    setEditingGoal(null);
  };

  const handleAddMilestone = () => {
    if (!newMilestone.trim()) return;
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { title: newMilestone.trim() }]
    }));
    setNewMilestone('');
  };

  const handleRemoveMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }

    try {
      const milestones: Milestone[] = formData.milestones.map((m, index) => ({
        id: `m-${Date.now()}-${index}`,
        title: m.title,
        completed: false
      }));

      if (editingGoal) {
        await updateGoal(editingGoal.id, {
          ...formData,
          milestones: editingGoal.milestones
        });
      } else {
        await addGoal({
          ...formData,
          milestones,
          completed: false
        });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Goal save error:', err);
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      priority: goal.priority,
      dueDate: goal.dueDate || '',
      milestones: goal.milestones.map(m => ({ title: m.title }))
    });
    setIsModalOpen(true);
  };

  const calculateProgress = (goal: Goal): number => {
    if (goal.milestones.length === 0) return goal.completed ? 100 : 0;
    const completed = goal.milestones.filter(m => m.completed).length;
    return Math.round((completed / goal.milestones.length) * 100);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'low': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const activeGoals = getActiveGoals();
  const completedGoals = getCompletedGoals();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-jade-900 to-jade-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="py-12 text-center text-white">
            <Target className="h-16 w-16 mx-auto mb-4 text-gold-400" />
            <h2 className="text-2xl font-bold mb-2">Sign in to track your goals</h2>
            <p className="text-white/70 mb-6">Create and monitor your personal growth journey</p>
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
                <Target className="h-6 w-6 text-gold-400" />
                My Goals
              </h1>
              <p className="text-sm text-white/60">Track your growth journey</p>
            </div>
          </div>
          <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gold-500 hover:bg-gold-600 text-jade-900 font-semibold">
                <Plus className="h-4 w-4 mr-1" /> New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-white">
              <DialogHeader>
                <DialogTitle className="text-jade-800 flex items-center gap-2">
                  <Target className="h-5 w-5 text-gold-500" />
                  {editingGoal ? 'Edit Goal' : 'Create New Goal'}
                </DialogTitle>
                <DialogDescription>
                  Set meaningful goals and track your progress
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-jade-700">Goal Title *</label>
                  <Input
                    placeholder="What do you want to achieve?"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-jade-700">Description</label>
                  <Textarea
                    placeholder="Why is this goal important to you?"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-jade-700">Category</label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GOAL_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.emoji} {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-jade-700">Priority</label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GOAL_PRIORITIES.map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-jade-700">Target Date</label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                {!editingGoal && (
                  <div>
                    <label className="text-sm font-medium text-jade-700">Milestones</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="Add a milestone..."
                        value={newMilestone}
                        onChange={(e) => setNewMilestone(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()}
                      />
                      <Button type="button" onClick={handleAddMilestone} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.milestones.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {formData.milestones.map((m, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm bg-jade-50 px-3 py-2 rounded-md">
                            <Circle className="h-3 w-3 text-jade-400" />
                            <span className="flex-1">{m.title}</span>
                            <button 
                              onClick={() => handleRemoveMilestone(i)} 
                              className="text-red-400 hover:text-red-600"
                              title="Remove milestone"
                              aria-label="Remove milestone"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    className="bg-jade-600 hover:bg-jade-700"
                  >
                    {editingGoal ? 'Save Changes' : 'Create Goal'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <div className="text-3xl font-bold text-gold-400">{activeGoals.length}</div>
              <div className="text-sm text-white/70">Active Goals</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <div className="text-3xl font-bold text-emerald-400">{completedGoals.length}</div>
              <div className="text-sm text-white/70">Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <div className="text-3xl font-bold text-white">
                {goals.length > 0 
                  ? Math.round((completedGoals.length / goals.length) * 100) 
                  : 0}%
              </div>
              <div className="text-sm text-white/70">Success Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="bg-white/10 border border-white/20">
            <TabsTrigger value="active" className="data-[state=active]:bg-white/20 text-white">
              Active ({activeGoals.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-white/20 text-white">
              Completed ({completedGoals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4 space-y-4">
            {loading ? (
              <div className="text-center py-12 text-white/60">Loading goals...</div>
            ) : activeGoals.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="py-12 text-center">
                  <Star className="h-12 w-12 mx-auto mb-4 text-gold-400/50" />
                  <h3 className="text-lg font-medium text-white mb-2">No active goals yet</h3>
                  <p className="text-white/60 mb-4">Start your journey by setting a meaningful goal</p>
                  <Button onClick={() => setIsModalOpen(true)} className="bg-gold-500 hover:bg-gold-600 text-jade-900">
                    <Plus className="h-4 w-4 mr-1" /> Create Your First Goal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              activeGoals.map((goal) => (
                <Card key={goal.id} className="bg-white border-none shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-jade-800">{goal.title}</h3>
                          <Badge className={cn("text-xs", getPriorityColor(goal.priority))}>
                            {goal.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {GOAL_CATEGORIES.find(c => c.value === goal.category)?.emoji} {goal.category}
                          </Badge>
                        </div>
                        {goal.description && (
                          <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                        )}
                        {goal.dueDate && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                            <Calendar className="h-4 w-4" />
                            Due: {new Date(goal.dueDate).toLocaleDateString()}
                          </div>
                        )}
                        {/* Progress */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium text-jade-600">{calculateProgress(goal)}%</span>
                          </div>
                          <Progress value={calculateProgress(goal)} className="h-2" />
                        </div>
                        {/* Milestones */}
                        {goal.milestones.length > 0 && (
                          <div className="space-y-2">
                            {goal.milestones.map((milestone) => (
                              <div 
                                key={milestone.id}
                                className={cn(
                                  "flex items-center gap-2 text-sm p-2 rounded-md cursor-pointer transition-colors",
                                  milestone.completed 
                                    ? "bg-emerald-50 text-emerald-700" 
                                    : "bg-gray-50 hover:bg-gray-100"
                                )}
                                onClick={() => toggleMilestone(goal.id, milestone.id)}
                              >
                                <Checkbox checked={milestone.completed} />
                                <span className={milestone.completed ? "line-through" : ""}>
                                  {milestone.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditGoal(goal)}
                          className="text-gray-400 hover:text-jade-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            if (confirm('Delete this goal?')) deleteGoal(goal.id);
                          }}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-4">
            {completedGoals.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-white/30" />
                  <h3 className="text-lg font-medium text-white mb-2">No completed goals yet</h3>
                  <p className="text-white/60">Keep working on your active goals!</p>
                </CardContent>
              </Card>
            ) : (
              completedGoals.map((goal) => (
                <Card key={goal.id} className="bg-white/90 border-none shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-700 line-through">{goal.title}</h3>
                        <p className="text-sm text-gray-500">
                          Completed • {GOAL_CATEGORIES.find(c => c.value === goal.category)?.label}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteGoal(goal.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}