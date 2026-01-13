"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLessonsEvent = exports.apiLessonsProgress = exports.apiLessonsContinue = exports.apiLessonsGet = void 0;
const functions = require("firebase-functions");
const firestore_1 = require("firebase-admin/firestore");
const firebase_init_1 = require("./firebase-init");
/**
 * Get a lesson by slug
 */
exports.apiLessonsGet = functions.https.onCall(async (data, context) => {
    const { slug } = data;
    if (!slug) {
        throw new functions.https.HttpsError('invalid-argument', 'Lesson slug is required');
    }
    try {
        // Find lesson by slug
        const snapshot = await firebase_init_1.db.collection('lessons')
            .where('slug', '==', slug)
            .limit(1)
            .get();
        if (snapshot.empty) {
            throw new functions.https.HttpsError('not-found', 'Lesson not found');
        }
        const doc = snapshot.docs[0];
        const lesson = Object.assign({ id: doc.id }, doc.data());
        // If user is authenticated, get their progress
        let progress = null;
        if (context.auth) {
            const progressDoc = await firebase_init_1.db.collection('lesson_progress')
                .doc(`${context.auth.uid}_${doc.id}`)
                .get();
            if (progressDoc.exists) {
                progress = progressDoc.data();
            }
        }
        return { ok: true, lesson, progress };
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError)
            throw error;
        console.error('[api-lessons-get] Error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get lesson');
    }
});
/**
 * Get lessons for continuing watching
 */
exports.apiLessonsContinue = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        // Get user's progress records sorted by updated_at
        const progressSnap = await firebase_init_1.db.collection('lesson_progress')
            .where('user_id', '==', context.auth.uid)
            .where('completed', '==', false)
            .orderBy('updated_at', 'desc')
            .limit(5)
            .get();
        if (progressSnap.empty) {
            return { ok: true, lessons: [] };
        }
        // Get the actual lesson data for each progress record
        const lessons = await Promise.all(progressSnap.docs.map(async (progressDoc) => {
            const progressData = progressDoc.data();
            const lessonDoc = await firebase_init_1.db.collection('lessons').doc(progressData.lesson_id).get();
            if (!lessonDoc.exists)
                return null;
            return Object.assign(Object.assign({ id: lessonDoc.id }, lessonDoc.data()), { progress: progressData });
        }));
        return { ok: true, lessons: lessons.filter(Boolean) };
    }
    catch (error) {
        console.error('[api-lessons-continue] Error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get continue watching');
    }
});
/**
 * Save lesson progress
 */
exports.apiLessonsProgress = functions.https.onCall(async (data, context) => {
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
            updated_at: firestore_1.FieldValue.serverTimestamp(),
        };
        await firebase_init_1.db.collection('lesson_progress').doc(progressId).set(progressData, { merge: true });
        return { ok: true };
    }
    catch (error) {
        console.error('[api-lessons-progress] Error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to save progress');
    }
});
/**
 * Log a lesson event (play, pause, complete, etc.)
 */
exports.apiLessonsEvent = functions.https.onCall(async (data, context) => {
    var _a;
    const { lesson_id, event_type, metadata } = data;
    if (!lesson_id || !event_type) {
        throw new functions.https.HttpsError('invalid-argument', 'Lesson ID and event type are required');
    }
    try {
        await firebase_init_1.db.collection('lesson_events').add({
            lesson_id,
            event_type,
            metadata: metadata || {},
            user_id: ((_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid) || null,
            created_at: firestore_1.FieldValue.serverTimestamp(),
        });
        return { ok: true };
    }
    catch (error) {
        console.error('[api-lessons-event] Error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to log event');
    }
});
//# sourceMappingURL=api-lessons.js.map