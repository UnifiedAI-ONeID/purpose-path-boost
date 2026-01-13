"use strict";
/**
 * PWA Firebase Functions
 *
 * Functions for the Progressive Web App:
 * - Boot/initialization
 * - Quiz handling
 * - AI suggestions
 * - Coaching recommendations
 * - User goals and summaries
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.pwaMeGoals = exports.pwaMeSummary = exports.pwaCoachingRecommend = exports.pwaAiSuggest = exports.pwaQuizAnswer = exports.pwaBoot = void 0;
const functions = require("firebase-functions");
const firestore_1 = require("firebase-admin/firestore");
const db = (0, firestore_1.getFirestore)();
/**
 * PWA Boot - Initialize user session and fetch essential data
 */
exports.pwaBoot = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = context.auth.uid;
    try {
        // Get or create user profile
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        let userData = userDoc.data();
        if (!userDoc.exists) {
            // Create new user profile
            userData = {
                created_at: new Date().toISOString(),
                last_active: new Date().toISOString(),
                quiz_completed: false,
                onboarding_step: 0
            };
            await userRef.set(userData);
        }
        else {
            // Update last active
            await userRef.update({ last_active: new Date().toISOString() });
        }
        // Get active goals count
        const goalsSnap = await db.collection('users').doc(userId)
            .collection('goals')
            .where('status', '==', 'active')
            .get();
        // Get recent lesson progress
        const progressSnap = await db.collection('users').doc(userId)
            .collection('lesson_progress')
            .orderBy('updated_at', 'desc')
            .limit(5)
            .get();
        const recentProgress = progressSnap.docs.map(doc => (Object.assign({ lessonId: doc.id }, doc.data())));
        return {
            ok: true,
            user: Object.assign(Object.assign({}, userData), { goalsCount: goalsSnap.size, recentProgress })
        };
    }
    catch (error) {
        console.error('PWA boot error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to initialize PWA');
    }
});
/**
 * PWA Quiz Answer - Process quiz answers and calculate results
 */
exports.pwaQuizAnswer = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { questionId, answer, isLastQuestion } = data || {};
    const userId = context.auth.uid;
    if (!questionId || answer === undefined) {
        throw new functions.https.HttpsError('invalid-argument', 'questionId and answer required');
    }
    try {
        // Store answer
        const answerRef = db.collection('users').doc(userId)
            .collection('quiz_answers').doc(questionId);
        await answerRef.set({
            answer,
            answered_at: new Date().toISOString()
        }, { merge: true });
        // If last question, calculate results
        if (isLastQuestion) {
            const answersSnap = await db.collection('users').doc(userId)
                .collection('quiz_answers').get();
            const answers = answersSnap.docs.map(doc => (Object.assign({ questionId: doc.id, answer: doc.data().answer }, doc.data())));
            // Calculate personality profile/recommendations based on answers
            const profile = calculateQuizProfile(answers);
            // Store results
            await db.collection('users').doc(userId).update({
                quiz_completed: true,
                quiz_profile: profile,
                quiz_completed_at: new Date().toISOString()
            });
            return { ok: true, completed: true, profile };
        }
        return { ok: true, completed: false };
    }
    catch (error) {
        console.error('Quiz answer error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to process quiz answer');
    }
});
/**
 * PWA AI Suggest - Get AI-powered suggestions
 */
exports.pwaAiSuggest = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { prompt, context: userContext } = data || {};
    const userId = context.auth.uid;
    if (!prompt) {
        throw new functions.https.HttpsError('invalid-argument', 'prompt required');
    }
    try {
        // Get user profile for personalization
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data() || {};
        // Build contextual prompt
        const suggestions = await generateAiSuggestions(prompt, Object.assign({ quizProfile: userData.quiz_profile, goals: userData.current_goals }, userContext));
        // Log AI interaction
        await db.collection('ai_interactions').add({
            userId,
            prompt,
            suggestions,
            created_at: new Date().toISOString()
        });
        return { ok: true, suggestions };
    }
    catch (error) {
        console.error('AI suggest error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to generate suggestions');
    }
});
/**
 * PWA Coaching Recommend - Get personalized coaching recommendations
 */
exports.pwaCoachingRecommend = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = context.auth.uid;
    try {
        // Get user data
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data() || {};
        // Get available coaching packages
        const packagesSnap = await db.collection('coaching_packages')
            .where('active', '==', true)
            .get();
        const packages = packagesSnap.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Calculate recommendations based on user profile
        const recommendations = calculateCoachingRecommendations(packages, userData.quiz_profile, userData.lesson_history);
        return { ok: true, recommendations, packages };
    }
    catch (error) {
        console.error('Coaching recommend error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get recommendations');
    }
});
/**
 * PWA Me Summary - Get user's personalized summary/dashboard data
 */
exports.pwaMeSummary = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = context.auth.uid;
    try {
        // Get user profile
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data() || {};
        // Get goals
        const goalsSnap = await db.collection('users').doc(userId)
            .collection('goals')
            .orderBy('created_at', 'desc')
            .limit(10)
            .get();
        const goals = goalsSnap.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Get lesson progress
        const progressSnap = await db.collection('users').doc(userId)
            .collection('lesson_progress')
            .orderBy('updated_at', 'desc')
            .limit(10)
            .get();
        const progress = progressSnap.docs.map(doc => (Object.assign({ lessonId: doc.id }, doc.data())));
        // Get achievements
        const achievementsSnap = await db.collection('users').doc(userId)
            .collection('achievements')
            .where('unlocked', '==', true)
            .get();
        const achievements = achievementsSnap.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Calculate stats
        const stats = {
            totalLessonsWatched: progress.length,
            goalsCompleted: goals.filter(g => g.status === 'completed').length,
            goalsActive: goals.filter(g => g.status === 'active').length,
            achievementsUnlocked: achievements.length,
            streakDays: userData.current_streak || 0
        };
        return {
            ok: true,
            user: {
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                quiz_profile: userData.quiz_profile
            },
            goals,
            progress,
            achievements,
            stats
        };
    }
    catch (error) {
        console.error('Me summary error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get summary');
    }
});
/**
 * PWA Me Goals - Manage user goals
 */
exports.pwaMeGoals = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { action, goalId, goalData } = data || {};
    const userId = context.auth.uid;
    const goalsRef = db.collection('users').doc(userId).collection('goals');
    try {
        switch (action) {
            case 'list': {
                const snapshot = await goalsRef.orderBy('created_at', 'desc').get();
                const goals = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                return { ok: true, goals };
            }
            case 'create': {
                if (!(goalData === null || goalData === void 0 ? void 0 : goalData.title)) {
                    throw new functions.https.HttpsError('invalid-argument', 'Goal title required');
                }
                const newGoal = Object.assign(Object.assign({}, goalData), { status: 'active', progress: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
                const docRef = await goalsRef.add(newGoal);
                return { ok: true, goalId: docRef.id, goal: newGoal };
            }
            case 'update': {
                if (!goalId) {
                    throw new functions.https.HttpsError('invalid-argument', 'goalId required');
                }
                await goalsRef.doc(goalId).update(Object.assign(Object.assign({}, goalData), { updated_at: new Date().toISOString() }));
                return { ok: true, message: 'Goal updated' };
            }
            case 'complete': {
                if (!goalId) {
                    throw new functions.https.HttpsError('invalid-argument', 'goalId required');
                }
                await goalsRef.doc(goalId).update({
                    status: 'completed',
                    progress: 100,
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
                return { ok: true, message: 'Goal completed' };
            }
            case 'delete': {
                if (!goalId) {
                    throw new functions.https.HttpsError('invalid-argument', 'goalId required');
                }
                await goalsRef.doc(goalId).delete();
                return { ok: true, message: 'Goal deleted' };
            }
            default:
                throw new functions.https.HttpsError('invalid-argument', `Unknown action: ${action}`);
        }
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError)
            throw error;
        console.error('Goals error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to manage goals');
    }
});
// Helper functions
function calculateQuizProfile(answers) {
    // Simple profile calculation based on answers
    // This would be customized based on quiz design
    const profile = {
        type: 'growth-seeker',
        strengths: ['self-awareness', 'motivation'],
        areas_to_develop: ['time-management'],
        recommended_path: 'clarity-track'
    };
    return profile;
}
async function generateAiSuggestions(prompt, context) {
    // Placeholder for AI integration
    // Would integrate with OpenAI, Gemini, etc.
    return [
        'Focus on setting clear, measurable goals',
        'Schedule dedicated time for self-reflection',
        'Consider joining a coaching session for personalized guidance'
    ];
}
function calculateCoachingRecommendations(packages, quizProfile, lessonHistory) {
    // Simple recommendation logic
    return packages.slice(0, 3).map(pkg => (Object.assign(Object.assign({}, pkg), { matchScore: Math.floor(Math.random() * 30) + 70, reason: 'Based on your profile' })));
}
//# sourceMappingURL=pwa-functions.js.map