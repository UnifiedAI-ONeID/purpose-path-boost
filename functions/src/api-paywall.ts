import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase-init';

/**
 * Check if user can watch a lesson (paywall logic)
 */
export const apiPaywallCanWatch = onCall(async (request) => {
  const { data, auth } = request;
  const { lesson_id } = data || {};
  
  if (!lesson_id) {
    throw new HttpsError('invalid-argument', 'Lesson ID is required');
  }
  
  try {
    // Get the lesson to check if it's gated
    const lessonDoc = await db.collection('lessons').doc(lesson_id).get();
    
    if (!lessonDoc.exists) {
      throw new HttpsError('not-found', 'Lesson not found');
    }
    
    const lesson = lessonDoc.data()!;
    
    // If lesson is free, allow access
    if (!lesson.is_premium) {
      return { ok: true, can_watch: true, reason: 'free_content' };
    }
    
    // If user is not authenticated, deny access to premium content
    if (!auth) {
      return { ok: true, can_watch: false, reason: 'not_authenticated' };
    }
    
    // Check if user has an active subscription
    const subSnap = await db.collection('subscriptions')
      .where('user_id', '==', auth.uid)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    
    if (!subSnap.empty) {
      return { ok: true, can_watch: true, reason: 'active_subscription' };
    }
    
    // Check if user has purchased this specific lesson/course
    const purchaseSnap = await db.collection('purchases')
      .where('user_id', '==', auth.uid)
      .where('item_id', '==', lesson_id)
      .limit(1)
      .get();
    
    if (!purchaseSnap.empty) {
      return { ok: true, can_watch: true, reason: 'purchased' };
    }
    
    // Check free preview count
    const previewDoc = await db.collection('user_previews')
      .doc(auth.uid)
      .get();
    
    const previews = previewDoc.exists ? previewDoc.data() : {};
    const watchedPremium = Object.keys(previews?.watched_premium || {}).length;
    const maxFreePreviews = 3;
    
    if (watchedPremium < maxFreePreviews) {
      return { ok: true, can_watch: true, reason: 'free_preview', previews_remaining: maxFreePreviews - watchedPremium - 1 };
    }
    
    return { ok: true, can_watch: false, reason: 'paywall' };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('[api-paywall-can-watch] Error:', error);
    throw new HttpsError('internal', 'Failed to check access');
  }
});

/**
 * Mark that user watched a lesson (for preview tracking)
 */
export const apiPaywallMarkWatch = onCall(async (request) => {
  const { data, auth } = request;
  
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { lesson_id } = data || {};
  
  if (!lesson_id) {
    throw new HttpsError('invalid-argument', 'Lesson ID is required');
  }
  
  try {
    await db.collection('user_previews').doc(auth.uid).set({
      watched_premium: {
        [lesson_id]: FieldValue.serverTimestamp(),
      },
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true });
    
    return { ok: true };
  } catch (error) {
    console.error('[api-paywall-mark-watch] Error:', error);
    throw new HttpsError('internal', 'Failed to mark watch');
  }
});

/**
 * Log telemetry/analytics events
 */
export const apiTelemetryLog = onCall(async (request) => {
  const { data, auth } = request;
  const { event_name, properties, session_id } = data || {};
  
  if (!event_name) {
    throw new HttpsError('invalid-argument', 'Event name is required');
  }
  
  try {
    await db.collection('analytics_events').add({
      event_name,
      properties: properties || {},
      session_id: session_id || null,
      user_id: auth?.uid || null,
      created_at: FieldValue.serverTimestamp(),
      user_agent: null,
    });
    
    return { ok: true };
  } catch (error) {
    console.error('[api-telemetry-log] Error:', error);
    throw new HttpsError('internal', 'Failed to log event');
  }
});

/**
 * Log telemetry/analytics events in batch
 */
export const apiTelemetryLogBatch = onCall(async (request) => {
  const { data, auth } = request;
  const { events } = data || {};
  
  if (!events || !Array.isArray(events)) {
    throw new HttpsError('invalid-argument', 'Events array is required');
  }
  
  if (events.length === 0) {
    return { ok: true, logged: 0 };
  }
  
  try {
    const batch = db.batch();
    const eventsCollection = db.collection('analytics_events');
    
    for (const event of events.slice(0, 100)) { // Max 100 events per batch
      const docRef = eventsCollection.doc();
      batch.set(docRef, {
        event_name: event.name || event.event_name,
        properties: event.payload || event.properties || {},
        session_id: event.sessionId || event.session_id || null,
        user_id: auth?.uid || null,
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
    
    return { ok: true, logged: Math.min(events.length, 100) };
  } catch (error) {
    console.error('[api-telemetry-log-batch] Error:', error);
    throw new HttpsError('internal', 'Failed to log events');
  }
});
