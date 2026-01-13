import * as functions from 'firebase-functions';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase-init';

/**
 * Get a lesson by slug
 */
export const apiLessonsGet = functions.https.onCall(async (data, context) => {
  const { slug } = data;
  
  if (!slug) {
    throw new functions.https.HttpsError('invalid-argument', 'Lesson slug is required');
  }
  
  try {
    // Find lesson by slug
    const snapshot = await db.collection('lessons')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'Lesson not found');
    }
    
    const doc = snapshot.docs[0];
    const lesson = { id: doc.id, ...doc.data() };
    
    // If user is authenticated, get their progress
    let progress = null;
    if (context.auth) {
      const progressDoc = await db.collection('lesson_progress')
        .doc(`${context.auth.uid}_${doc.id}`)
        .get();
      
      if (progressDoc.exists) {
        progress = progressDoc.data();
      }
    }
    
    return { ok: true, lesson, progress };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('[api-lessons-get] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get lesson');
  }
});

/**
 * Get lessons for continuing watching
 */
export const apiLessonsContinue = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  try {
    // Get user's progress records sorted by updated_at
    const progressSnap = await db.collection('lesson_progress')
      .where('user_id', '==', context.auth.uid)
      .where('completed', '==', false)
      .orderBy('updated_at', 'desc')
      .limit(5)
      .get();
    
    if (progressSnap.empty) {
      return { ok: true, lessons: [] };
    }
    
    // Get the actual lesson data for each progress record
    const lessons = await Promise.all(
      progressSnap.docs.map(async (progressDoc) => {
        const progressData = progressDoc.data();
        const lessonDoc = await db.collection('lessons').doc(progressData.lesson_id).get();
        
        if (!lessonDoc.exists) return null;
        
        return {
          id: lessonDoc.id,
          ...lessonDoc.data(),
          progress: progressData,
        };
      })
    );
    
    return { ok: true, lessons: lessons.filter(Boolean) };
  } catch (error) {
    console.error('[api-lessons-continue] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get continue watching');
  }
});

/**
 * Save lesson progress
 */
export const apiLessonsProgress = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { lesson_id, progress_seconds, total_seconds, completed } = data;
  
  if (!lesson_id) {
    throw new functions.https.HttpsError('invalid-argument', 'Lesson ID is required');
  }
  
  try {
    const progressId = `${context.auth.uid}_${lesson_id}`;
    const progressData = {
      user_id: context.auth.uid,
      lesson_id,
      progress_seconds: progress_seconds || 0,
      total_seconds: total_seconds || 0,
      completed: completed || false,
      updated_at: FieldValue.serverTimestamp(),
    };
    
    await db.collection('lesson_progress').doc(progressId).set(progressData, { merge: true });
    
    return { ok: true };
  } catch (error) {
    console.error('[api-lessons-progress] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to save progress');
  }
});

/**
 * Log a lesson event (play, pause, complete, etc.)
 */
export const apiLessonsEvent = functions.https.onCall(async (data, context) => {
  const { lesson_id, event_type, metadata } = data;
  
  if (!lesson_id || !event_type) {
    throw new functions.https.HttpsError('invalid-argument', 'Lesson ID and event type are required');
  }
  
  try {
    await db.collection('lesson_events').add({
      lesson_id,
      event_type,
      metadata: metadata || {},
      user_id: context.auth?.uid || null,
      created_at: FieldValue.serverTimestamp(),
    });
    
    return { ok: true };
  } catch (error) {
    console.error('[api-lessons-event] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to log event');
  }
});
