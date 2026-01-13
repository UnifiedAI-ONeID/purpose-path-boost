"use strict";
/**
 * Dashboard User Functions
 *
 * Functions for user dashboard data - summary, analytics, and personalization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardUserAnalytics = exports.dashboardUserSummary = void 0;
const functions = require("firebase-functions");
const firestore_1 = require("firebase-admin/firestore");
const db = (0, firestore_1.getFirestore)();
/**
 * Dashboard User Summary - Get basic summary for user dashboard
 * Used by PlanBadge and UpcomingSessions components
 */
exports.dashboardUserSummary = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = context.auth.uid;
    try {
        // Get user profile to determine plan
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data() || {};
        const plan = userData.plan || userData.subscription_tier || 'free';
        // Get next upcoming session/booking
        const now = new Date().toISOString();
        const bookingsSnap = await db.collection('bookings')
            .where('user_id', '==', userId)
            .where('start_at', '>=', now)
            .where('status', 'in', ['confirmed', 'scheduled'])
            .orderBy('start_at', 'asc')
            .limit(1)
            .get();
        let next_session = null;
        if (!bookingsSnap.empty) {
            const booking = bookingsSnap.docs[0].data();
            next_session = {
                start_at: booking.start_at,
                title: booking.title || booking.session_type || 'Coaching session'
            };
        }
        return {
            ok: true,
            plan,
            next_session
        };
    }
    catch (error) {
        console.error('Dashboard user summary error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get summary');
    }
});
/**
 * Dashboard User Analytics - Detailed analytics for user dashboard
 * Used by useUserAnalytics hook
 */
exports.dashboardUserAnalytics = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { profile_id } = data || {};
    const userId = context.auth.uid;
    // Verify profile_id matches or user has access
    if (profile_id && profile_id !== userId) {
        // Could add admin check here if needed
        console.warn(`User ${userId} requested analytics for profile ${profile_id}`);
    }
    const targetUserId = profile_id || userId;
    try {
        // Get user profile
        const userDoc = await db.collection('users').doc(targetUserId).get();
        const userData = userDoc.data() || {};
        // Calculate date ranges
        const now = new Date();
        const d7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const d30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        // Get streak from user data or calculate
        const streak = userData.current_streak || userData.streak_days || 0;
        // Get lesson events for minutes watched
        const eventsD30Snap = await db.collection('lesson_events')
            .where('user_id', '==', targetUserId)
            .where('timestamp', '>=', d30Ago.toISOString())
            .get();
        let minutesD7 = 0;
        let minutesD30 = 0;
        let starts30 = 0;
        let completes30 = 0;
        eventsD30Snap.docs.forEach(doc => {
            const event = doc.data();
            const eventDate = new Date(event.timestamp);
            const duration = event.duration || event.watch_time || 0;
            if (eventDate >= d7Ago) {
                minutesD7 += Math.round(duration / 60);
            }
            minutesD30 += Math.round(duration / 60);
            if (event.event === 'start' || event.event === 'view') {
                starts30++;
            }
            if (event.event === 'complete' || event.progress === 100) {
                completes30++;
            }
        });
        // Get bookings for the month
        const bookingsSnap = await db.collection('bookings')
            .where('user_id', '==', targetUserId)
            .where('start_at', '>=', monthStart.toISOString())
            .where('start_at', '<=', monthEnd.toISOString())
            .get();
        let bookedCount = 0;
        let attendedCount = 0;
        bookingsSnap.docs.forEach(doc => {
            const booking = doc.data();
            bookedCount++;
            if (booking.status === 'completed' || booking.attended) {
                attendedCount++;
            }
        });
        // Get plan info
        const planSlug = userData.plan || userData.subscription_tier || 'free';
        const planWindow = {
            start: monthStart.toISOString(),
            end: monthEnd.toISOString()
        };
        // Calculate remaining sessions (if applicable)
        let remaining = null;
        if (userData.sessions_remaining !== undefined) {
            remaining = userData.sessions_remaining;
        }
        else if (planSlug === 'starter') {
            remaining = Math.max(0, 4 - bookedCount);
        }
        else if (planSlug === 'growth') {
            remaining = Math.max(0, 8 - bookedCount);
        }
        // Get referrals
        const referralsSnap = await db.collection('referrals')
            .where('referrer_id', '==', targetUserId)
            .get();
        let invited = 0;
        let converted = 0;
        referralsSnap.docs.forEach(doc => {
            const ref = doc.data();
            invited++;
            if (ref.status === 'converted' || ref.converted_at) {
                converted++;
            }
        });
        // Get habits count
        const habitsSnap = await db.collection('users').doc(targetUserId)
            .collection('habits')
            .where('active', '==', true)
            .get();
        const habits = habitsSnap.size;
        // Determine next best action
        const nextBestAction = determineNextBestAction({
            streak,
            minutesD7,
            bookedCount,
            completes30,
            habits,
            planSlug
        });
        return {
            ok: true,
            streak,
            minutes: { d7: minutesD7, d30: minutesD30 },
            completion: {
                starts30,
                completes30,
                rate: starts30 > 0 ? Math.round((completes30 / starts30) * 100) : 0
            },
            bookings: {
                month: { booked: bookedCount, attended: attendedCount }
            },
            plan: {
                slug: planSlug,
                remaining,
                window: planWindow
            },
            referrals: { invited, converted },
            habits,
            next_best_action: nextBestAction,
            now: now.toISOString()
        };
    }
    catch (error) {
        console.error('Dashboard user analytics error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get analytics');
    }
});
/**
 * Helper to determine the next best action for the user
 */
function determineNextBestAction(params) {
    const { streak, minutesD7, bookedCount, completes30, habits, planSlug } = params;
    // No streak? Encourage daily practice
    if (streak === 0) {
        return {
            title: 'Start your streak',
            cta: 'Watch a lesson',
            href: '/lessons',
            reason: 'Build momentum with consistent daily practice'
        };
    }
    // Low watch time? Encourage learning
    if (minutesD7 < 15) {
        return {
            title: 'Continue learning',
            cta: 'Watch lessons',
            href: '/lessons',
            reason: `You've watched ${minutesD7} minutes this week. Aim for 30+!`
        };
    }
    // No bookings? Encourage coaching
    if (bookedCount === 0 && planSlug !== 'free') {
        return {
            title: 'Book a session',
            cta: 'Schedule coaching',
            href: '/coaching',
            reason: 'Your plan includes coaching sessions. Don\'t miss out!'
        };
    }
    // Low completions? Encourage finishing
    if (completes30 < 3) {
        return {
            title: 'Complete lessons',
            cta: 'Finish started lessons',
            href: '/lessons',
            reason: 'Completing lessons unlocks deeper insights'
        };
    }
    // No habits? Encourage habit tracking
    if (habits === 0) {
        return {
            title: 'Track your habits',
            cta: 'Set up habits',
            href: '/habits',
            reason: 'Build lasting change with daily habit tracking'
        };
    }
    // Free plan? Encourage upgrade
    if (planSlug === 'free') {
        return {
            title: 'Unlock more',
            cta: 'View plans',
            href: '/pricing',
            reason: 'Upgrade to access coaching and premium content'
        };
    }
    // Default: celebrate progress
    return {
        title: 'Keep going!',
        cta: 'Continue journey',
        href: '/dashboard',
        reason: `${streak} day streak! You're making great progress`
    };
}
//# sourceMappingURL=dashboard-user-functions.js.map