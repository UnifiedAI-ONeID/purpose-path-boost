/**
 * @file JournalContext - Manages user journal entries with Firebase integration
 * Provides state management for journal entries, moods, and reflections
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
  onSnapshot,
  limit
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';

// --- Type Definitions ---

export type Mood = 'great' | 'good' | 'neutral' | 'low' | 'struggling';

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: Mood;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  userId?: string;
  promptUsed?: string;
}

interface JournalContextValue {
  entries: JournalEntry[];
  loading: boolean;
  error: string | null;
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  getEntriesByMood: (mood: Mood) => JournalEntry[];
  getEntriesByTag: (tag: string) => JournalEntry[];
  getFavorites: () => JournalEntry[];
  getRecentEntries: (count?: number) => JournalEntry[];
  searchEntries: (query: string) => JournalEntry[];
  refreshEntries: () => Promise<void>;
}

// --- Context ---

const JournalContext = createContext<JournalContextValue | undefined>(undefined);

const COLLECTION = 'me_journal';

// --- Provider Component ---

export function JournalProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
      if (!user) {
        setEntries([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch entries when user changes
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
        const fetchedEntries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as JournalEntry[];
        setEntries(fetchedEntries);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[JournalContext] Fetch error:', err);
        setError('Failed to load journal entries');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const refreshEntries = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const fetchedEntries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as JournalEntry[];
      setEntries(fetchedEntries);
    } catch (err) {
      console.error('[JournalContext] Refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addEntry = useCallback(async (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!userId) {
      toast.error('Please sign in to add journal entries');
      return;
    }

    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, COLLECTION), {
        ...entry,
        userId,
        tags: entry.tags || [],
        isFavorite: false,
        createdAt: now,
        updatedAt: now
      });
      toast.success('Journal entry saved!');
    } catch (err) {
      console.error('[JournalContext] Add error:', err);
      toast.error('Failed to save entry');
      throw err;
    }
  }, [userId]);

  const updateEntry = useCallback(async (id: string, updates: Partial<JournalEntry>) => {
    try {
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      toast.success('Entry updated!');
    } catch (err) {
      console.error('[JournalContext] Update error:', err);
      toast.error('Failed to update entry');
      throw err;
    }
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION, id));
      toast.success('Entry deleted');
    } catch (err) {
      console.error('[JournalContext] Delete error:', err);
      toast.error('Failed to delete entry');
      throw err;
    }
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    await updateEntry(id, { isFavorite: !entry.isFavorite });
  }, [entries, updateEntry]);

  const getEntriesByMood = useCallback((mood: Mood) => {
    return entries.filter(e => e.mood === mood);
  }, [entries]);

  const getEntriesByTag = useCallback((tag: string) => {
    return entries.filter(e => e.tags.includes(tag));
  }, [entries]);

  const getFavorites = useCallback(() => {
    return entries.filter(e => e.isFavorite);
  }, [entries]);

  const getRecentEntries = useCallback((count: number = 5) => {
    return entries.slice(0, count);
  }, [entries]);

  const searchEntries = useCallback((searchQuery: string) => {
    const lowerQuery = searchQuery.toLowerCase();
    return entries.filter(e => 
      e.title.toLowerCase().includes(lowerQuery) ||
      e.content.toLowerCase().includes(lowerQuery) ||
      e.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }, [entries]);

  const value: JournalContextValue = {
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleFavorite,
    getEntriesByMood,
    getEntriesByTag,
    getFavorites,
    getRecentEntries,
    searchEntries,
    refreshEntries
  };

  return (
    <JournalContext.Provider value={value}>
      {children}
    </JournalContext.Provider>
  );
}

// --- Hook ---

export function useJournal() {
  const context = useContext(JournalContext);
  if (context === undefined) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
}

// --- Mood Labels ---

export const MOOD_OPTIONS: { value: Mood; label: string; emoji: string; color: string }[] = [
  { value: 'great', label: 'Great', emoji: '🌟', color: 'text-green-500' },
  { value: 'good', label: 'Good', emoji: '😊', color: 'text-emerald-500' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: 'text-gray-500' },
  { value: 'low', label: 'Low', emoji: '😔', color: 'text-amber-500' },
  { value: 'struggling', label: 'Struggling', emoji: '😢', color: 'text-red-500' }
];

// --- Journal Prompts ---

export const JOURNAL_PROMPTS: string[] = [
  "What are you grateful for today?",
  "What's one thing you learned recently?",
  "Describe a challenge you're facing and how you might overcome it.",
  "What made you smile today?",
  "What are your top priorities for tomorrow?",
  "Reflect on a recent success, no matter how small.",
  "What's something you'd like to improve about yourself?",
  "Describe your ideal day.",
  "What fears are holding you back?",
  "What does success mean to you right now?"
];