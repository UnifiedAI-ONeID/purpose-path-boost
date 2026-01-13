/**
 * @file GoalContext - Manages user goals with Firebase integration
 * Provides state management for goals, milestones, and progress tracking
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { db, auth } from '@/firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';

// --- Type Definitions ---

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'career' | 'personal' | 'health' | 'relationships' | 'financial' | 'spiritual';
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  progress: number;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
  isCompleted?: boolean;
  userId?: string;
}

export type GoalCategory = Goal['category'];
export type GoalPriority = Goal['priority'];

interface GoalContextValue {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  toggleMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  getGoalsByCategory: (category: GoalCategory) => Goal[];
  getActiveGoals: () => Goal[];
  getCompletedGoals: () => Goal[];
  refreshGoals: () => Promise<void>;
}

// --- Context ---

const GoalContext = createContext<GoalContextValue | undefined>(undefined);

const COLLECTION = 'me_goals';

// --- Provider Component ---

export function GoalProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
      if (!user) {
        setGoals([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch goals when user changes
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const fetchedGoals = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Goal[];
        setGoals(fetchedGoals);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[GoalContext] Fetch error:', err);
        setError('Failed to load goals');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const refreshGoals = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const fetchedGoals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Goal[];
      setGoals(fetchedGoals);
    } catch (err) {
      console.error('[GoalContext] Refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!userId) {
      toast.error('Please sign in to add goals');
      return;
    }

    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, COLLECTION), {
        ...goal,
        userId,
        progress: goal.progress || 0,
        milestones: goal.milestones || [],
        isCompleted: false,
        createdAt: now,
        updatedAt: now
      });
      toast.success('Goal added successfully!');
    } catch (err) {
      console.error('[GoalContext] Add error:', err);
      toast.error('Failed to add goal');
      throw err;
    }
  }, [userId]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    try {
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      toast.success('Goal updated!');
    } catch (err) {
      console.error('[GoalContext] Update error:', err);
      toast.error('Failed to update goal');
      throw err;
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION, id));
      toast.success('Goal deleted');
    } catch (err) {
      console.error('[GoalContext] Delete error:', err);
      toast.error('Failed to delete goal');
      throw err;
    }
  }, []);

  const toggleMilestone = useCallback(async (goalId: string, milestoneId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const updatedMilestones = goal.milestones.map(m =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );

    // Calculate new progress based on completed milestones
    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const newProgress = updatedMilestones.length > 0 
      ? Math.round((completedCount / updatedMilestones.length) * 100)
      : goal.progress;

    await updateGoal(goalId, { 
      milestones: updatedMilestones,
      progress: newProgress,
      isCompleted: newProgress === 100
    });
  }, [goals, updateGoal]);

  const getGoalsByCategory = useCallback((category: GoalCategory) => {
    return goals.filter(g => g.category === category);
  }, [goals]);

  const getActiveGoals = useCallback(() => {
    return goals.filter(g => !g.isCompleted);
  }, [goals]);

  const getCompletedGoals = useCallback(() => {
    return goals.filter(g => g.isCompleted);
  }, [goals]);

  const value: GoalContextValue = {
    goals,
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleMilestone,
    getGoalsByCategory,
    getActiveGoals,
    getCompletedGoals,
    refreshGoals
  };

  return (
    <GoalContext.Provider value={value}>
      {children}
    </GoalContext.Provider>
  );
}

// --- Hook ---

export function useGoals() {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  return context;
}

// --- Category & Priority Labels ---

export const GOAL_CATEGORIES: { value: GoalCategory; label: string; emoji: string }[] = [
  { value: 'career', label: 'Career', emoji: '💼' },
  { value: 'personal', label: 'Personal Growth', emoji: '🌱' },
  { value: 'health', label: 'Health & Wellness', emoji: '🏃' },
  { value: 'relationships', label: 'Relationships', emoji: '❤️' },
  { value: 'financial', label: 'Financial', emoji: '💰' },
  { value: 'spiritual', label: 'Spiritual', emoji: '🧘' }
];

export const GOAL_PRIORITIES: { value: GoalPriority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'text-red-500' },
  { value: 'medium', label: 'Medium', color: 'text-amber-500' },
  { value: 'low', label: 'Low', color: 'text-green-500' }
];