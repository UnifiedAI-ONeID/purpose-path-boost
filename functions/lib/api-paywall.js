"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiTelemetryLogBatch = exports.apiTelemetryLog = exports.apiPaywallMarkWatch = exports.apiPaywallCanWatch = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const firebase_init_1 = require("./firebase-init");
/**
 * Check if user can watch a lesson (paywall logic)
 */
exports.apiPaywallCanWatch = (0, https_1.onCall)(async (request) => {
    const { data, auth } = request;
    const { lesson_id } = data || {};
    if (!lesson_id) {
        throw new https_1.HttpsError('invalid-argument', 'Lesson ID is required');
    }
    try {
        // Get the lesson to check if it's gated
        const lessonDoc = await firebase_init_1.db.collection('lessons').doc(lesson_id).get();
        if (!lessonDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Lesson not found');
        }
        const lesson = lessonDoc.data();
        // If lesson is free, allow access
        if (!lesson.is_premium) {
            return { ok: true, can_watch: true, reason: 'free_content' };
        }
        // If user is not authenticated, deny access to premium content
        if (!auth) {
            return { ok: true, can_watch: false, reason: 'not_authenticated' };
        }
        // Check if user has an active subscription
        const subSnap = await firebase_init_1.db.collection('subscriptions')
            .where('user_id', '==', auth.uid)
            .where('status', '==', 'active')
            .limit(1)
            .get();
        if (!subSnap.empty) {
            return { ok: true, can_watch: true, reason: 'active_subscription' };
        }
        // Check if user has purchased this specific lesson/course
        const purchaseSnap = await firebase_init_1.db.collection('purchases')
            .where('user_id', '==', auth.uid)
            .where('item_id', '==', lesson_id)
            .limit(1)
            .get();
        if (!purchaseSnap.empty) {
            return { ok: true, can_watch: true, reason: 'purchased' };
        }
        // Check free preview count
        const previewDoc = await firebase_init_1.db.collection('user_previews')
            .doc(auth.uid)
            .get();
        const previews = previewDoc.exists ? previewDoc.data() : {};
        const watchedPremium = Object.keys((previews === null || previews === void 0 ? void 0 : previews.watched_premium) || {}).length;
        const maxFreePreviews = 3;
        if (watchedPremium < maxFreePreviews) {
            return { ok: true, can_watch: true, reason: 'free_preview', previews_remaining: maxFreePreviews - watchedPremium - 1 };
        }
        return { ok: true, can_watch: false, reason: 'paywall' };
    }
    catch (error) {
        if (error instanceof https_1.HttpsError)
            throw error;
        console.error('[api-paywall-can-watch] Error:', error);
        throw new https_1.HttpsError('internal', 'Failed to check access');
    }
});
/**
 * Mark that user watched a lesson (for preview tracking)
 */
exports.apiPaywallMarkWatch = (0, https_1.onCall)(async (request) => {
    const { data, auth } = request;
    if (!auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { lesson_id } = data || {};
    if (!lesson_id) {
        throw new https_1.HttpsError('invalid-argument', 'Lesson ID is required');
    }
    try {
        await firebase_init_1.db.collection('user_previews').doc(auth.uid).set({
            watched_premium: {
                [lesson_id]: firestore_1.FieldValue.serverTimestamp(),
            },
            updated_at: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        return { ok: true };
    }
    catch (error) {
        console.error('[api-paywall-mark-watch] Error:', error);
        throw new https_1.HttpsError('internal', 'Failed to mark watch');
    }
});
/**
 * Log telemetry/analytics events
 */
exports.apiTelemetryLog = (0, https_1.onCall)(async (request) => {
    const { data, auth } = request;
    const { event_name, properties, session_id } = data || {};
    if (!event_name) {
        throw new https_1.HttpsError('invalid-argument', 'Event name is required');
    }
    try {
        await firebase_init_1.db.collection('analytics_events').add({
            event_name,
            properties: properties || {},
            session_id: session_id || null,
            user_id: (auth === null || auth === void 0 ? void 0 : auth.uid) || null,
            created_at: firestore_1.FieldValue.serverTimestamp(),
            user_agent: null,
        });
        return { ok: true };
    }
    catch (error) {
        console.error('[api-telemetry-log] Error:', error);
        throw new https_1.HttpsError('internal', 'Failed to log event');
    }
});
/**
 * Log telemetry/analytics events in batch
 */
exports.apiTelemetryLogBatch = (0, https_1.onCall)(async (request) => {
    const { data, auth } = request;
    const { events } = data || {};
    if (!events || !Array.isArray(events)) {
        throw new https_1.HttpsError('invalid-argument', 'Events array is required');
    }
    if (events.length === 0) {
        return { ok: true, logged: 0 };
    }
    try {
        const batch = firebase_init_1.db.batch();
        const eventsCollection = firebase_init_1.db.collection('analytics_events');
        for (const event of events.slice(0, 100)) { // Max 100 events per batch
            const docRef = eventsCollection.doc();
            batch.set(docRef, {
                event_name: event.name || event.event_name,
                properties: event.payload || event.properties || {},
                session_id: event.sessionId || event.session_id || null,
                user_id: (auth === null || auth === void 0 ? void 0 : auth.uid) || null,
                route: event.route || null,
                referrer: event.referrer || null,
                device: event.device || null,
                lang: event.lang || null,
                utm: event.utm || null,
                client_ts: event.ts || null,
                created_at: firestore_1.FieldValue.serverTimestamp(),
            });
        }
        await batch.commit();
        return { ok: true, logged: Math.min(events.length, 100) };
    }
    catch (error) {
        console.error('[api-telemetry-log-batch] Error:', error);
        throw new https_1.HttpsError('internal', 'Failed to log events');
    }
});
//# sourceMappingURL=api-paywall.js.map