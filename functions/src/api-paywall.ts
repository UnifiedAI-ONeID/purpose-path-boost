import * as functions from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Check if user can watch a lesson (paywall logic)
 */
export const apiPaywallCanWatch = functions.https.onCall(async (data, context) => {
  const { lesson_id } = data;
  
  if (!lesson_id) {
    throw new functions.https.HttpsError('invalid-argument', 'Lesson ID is required');
  }
  
  try {
    // Get the lesson to check if it's gated
    const lessonDoc = await db.collection('lessons').doc(lesson_id).get();
    
    if (!lessonDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Lesson not found');
    }
    
    const lesson = lessonDoc.data()!;
    
    // If lesson is free, allow access
    if (!lesson.is_premium) {
      return { ok: true, can_watch: true, reason: 'free_content' };
    }
    
    // If user is not authenticated, deny access to premium content
    if (!context.auth) {
      return { ok: true, can_watch: false, reason: 'not_authenticated' };
    }
    
    // Check if user has an active subscription
    const subSnap = await db.collection('subscriptions')
      .where('user_id', '==', context.auth.uid)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    
    if (!subSnap.empty) {
      return { ok: true, can_watch: true, reason: 'active_subscription' };
    }
    
    // Check if user has purchased this specific lesson/course
    const purchaseSnap = await db.collection('purchases')
      .where('user_id', '==', context.auth.uid)
      .where('item_id', '==', lesson_id)
      .limit(1)
      .get();
    
    if (!purchaseSnap.empty) {
      return { ok: true, can_watch: true, reason: 'purchased' };
    }
    
    // Check free preview count
    const previewDoc = await db.collection('user_previews')
      .doc(context.auth.uid)
      .get();
    
    const previews = previewDoc.exists ? previewDoc.data() : {};
    const watchedPremium = Object.keys(previews?.watched_premium || {}).length;
    const maxFreePreviews = 3;
    
    if (watchedPremium < maxFreePreviews) {
      return { ok: true, can_watch: true, reason: 'free_preview', previews_remaining: maxFreePreviews - watchedPremium - 1 };
    }
    
    return { ok: true, can_watch: false, reason: 'paywall' };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('[api-paywall-can-watch] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to check access');
  }
});

/**
 * Mark that user watched a lesson (for preview tracking)
 */
export const apiPaywallMarkWatch = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { lesson_id } = data;
  
  if (!lesson_id) {
    throw new functions.https.HttpsError('invalid-argument', 'Lesson ID is required');
  }
  
  try {
    await db.collection('user_previews').doc(context.auth.uid).set({
      watched_premium: {
        [lesson_id]: FieldValue.serverTimestamp(),
      },
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true });
    
    return { ok: true };
  } catch (error) {
    console.error('[api-paywall-mark-watch] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to mark watch');
  }
});

/**
 * Log telemetry/analytics events
 */
export const apiTelemetryLog = functions.https.onCall(async (data, context) => {
  const { event_name, properties, session_id } = data;
  
  if (!event_name) {
    throw new functions.https.HttpsError('invalid-argument', 'Event name is required');
  }
  
  try {
    await db.collection('analytics_events').add({
      event_name,
      properties: properties || {},
      session_id: session_id || null,
      user_id: context.auth?.uid || null,
      created_at: FieldValue.serverTimestamp(),
      user_agent: null, // Would need request context
    });
    
    return { ok: true };
  } catch (error) {
    console.error('[api-telemetry-log] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to log event');
  }
});

/**
 * Log telemetry/analytics events in batch
 */
export const apiTelemetryLogBatch = functions.https.onCall(async (data, context) => {
  const { events } = data;
  
  if (!events || !Array.isArray(events)) {
    throw new functions.https.HttpsError('invalid-argument', 'Events array is required');
  }
  
  if (events.length === 0) {
    return { ok: true, logged: 0 };
  }
  
  try {
    const batch = db.batch();
    const eventsCollection = db.collection('analytics_events');
    
    for (const event of events) {
      const docRef = eventsCollection.doc();
      batch.set(docRef, {
        event_name: event.name,
        properties: event.payload || {},
        session_id: event.sessionId || null,
        user_id: context.auth?.uid || null,
        route: event.route || null,
        referrer: event.referrer || null,
        device: event.device || null,
        lang: event.lang || null,
        utm: event.utm || null,
        client_ts: event.ts || null,
        created_at: FieldValue.serverTimestamp(),
      });
    }
    
    await batch.commit();
    
    return { ok: true, logged: events.length };
  } catch (error) {
    console.error('[api-telemetry-log-batch] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to log events');
  }
});
