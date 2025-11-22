import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Chapter {
  t: number;
  label: string;
}

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  summary?: string; // summary_en in old schema
  contentUrl?: string;
  ytId?: string; // yt_id
  durationSec: number;
  tags?: string[];
  order: number; // order_index
  published: boolean;
  chapters?: Chapter[];
  posterUrl?: string;
}

export interface LessonProgress {
  lessonId: string;
  lessonSlug: string; // stored for easy display in "continue watching" without extra read
  userId: string;
  lastPositionSec: number;
  durationSec: number;
  completed: boolean;
  lastWatchedAt: Date;
  posterUrl?: string; // denormalized for UI
  ytId?: string;      // denormalized for UI
}

const LESSONS_COLLECTION = 'lessons';
const USERS_COLLECTION = 'users';

export const lessonService = {
  /**
   * Get all published lessons, ordered
   */
  async getLessons(): Promise<Lesson[]> {
    const q = query(
      collection(db, LESSONS_COLLECTION),
      where('published', '==', true),
      orderBy('order', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Lesson));
  },

  /**
   * Get a single lesson by slug
   */
  async getLessonBySlug(slug: string): Promise<Lesson | null> {
    const q = query(
      collection(db, LESSONS_COLLECTION),
      where('slug', '==', slug),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as Lesson;
  },

  /**
   * Update progress for a user on a lesson
   */
  async updateProgress(
    userId: string, 
    lesson: Lesson, 
    positionSec: number, 
    isCompleted: boolean = false
  ) {
    const progressRef = doc(db, USERS_COLLECTION, userId, 'lesson_progress', lesson.id);
    
    const data: Omit<LessonProgress, 'lastWatchedAt'> = {
      userId,
      lessonId: lesson.id,
      lessonSlug: lesson.slug,
      lastPositionSec: positionSec,
      durationSec: lesson.durationSec,
      completed: isCompleted,
      posterUrl: lesson.posterUrl,
      ytId: lesson.ytId
    };

    await setDoc(progressRef, {
      ...data,
      lastWatchedAt: new Date() // Firestore will convert to Timestamp
    }, { merge: true });
  },

  /**
   * Get the latest "Continue Watching" item
   */
  async getContinueWatching(userId: string): Promise<LessonProgress | null> {
    const q = query(
      collection(db, USERS_COLLECTION, userId, 'lesson_progress'),
      where('completed', '==', false),
      orderBy('lastWatchedAt', 'desc'),
      limit(1)
    );

    const snap = await getDocs(q);
    if (snap.empty) return null;

    const data = snap.docs[0].data();
    return {
      ...data,
      lastWatchedAt: (data.lastWatchedAt as Timestamp).toDate()
    } as LessonProgress;
  },

  /**
   * Get progress for a specific lesson
   */
  async getProgress(userId: string, lessonId: string): Promise<LessonProgress | null> {
    const snap = await getDoc(doc(db, USERS_COLLECTION, userId, 'lesson_progress', lessonId));
    if (!snap.exists()) return null;
    
    const data = snap.data();
    return {
      ...data,
      lastWatchedAt: (data.lastWatchedAt as Timestamp).toDate()
    } as LessonProgress;
  }
};
