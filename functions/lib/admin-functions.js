"use strict";
/**
 * Admin Dashboard & Management Functions
 *
 * Functions for admin dashboard metrics, referrals, funnel, etc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureQuizLead = exports.seoWatch = exports.contentLeaderboard = exports.adminReferralsCreate = exports.adminReferralsSettings = exports.adminReferralsOverview = exports.dashboardAdminMetrics = exports.adminGetVersion = exports.adminCheckRole = void 0;
const functions = require("firebase-functions");
const firestore_1 = require("firebase-admin/firestore");
const db = (0, firestore_1.getFirestore)();
// Helper to verify admin role
async function verifyAdmin(context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Check admin role in Firestore
    const userDoc = await db.collection('admins').doc(context.auth.uid).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }
}
/**
 * Admin Check Role - Verify if user has admin privileges
 */
exports.adminCheckRole = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        return { isAdmin: false };
    }
    try {
        const userDoc = await db.collection('admins').doc(context.auth.uid).get();
        const isAdmin = userDoc.exists;
        const role = ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) || 'viewer';
        return { isAdmin, role };
    }
    catch (error) {
        console.error('Check role error:', error);
        return { isAdmin: false };
    }
});
/**
 * Admin Get Version - Get current app version
 */
exports.adminGetVersion = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    try {
        const versionDoc = await db.collection('system').doc('version').get();
        const versionData = versionDoc.data() || { version: '0.0.1', updated_at: null };
        return Object.assign({ ok: true }, versionData);
    }
    catch (error) {
        console.error('Get version error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get version');
    }
});
/**
 * Dashboard Admin Metrics - Get metrics for admin dashboard
 */
exports.dashboardAdminMetrics = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    const { timeRange = '7d' } = data || {};
    try {
        // Calculate date range
        const now = new Date();
        const daysBack = parseInt(timeRange) || 7;
        const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
        const startDateStr = startDate.toISOString();
        // Get leads count
        const leadsSnap = await db.collection('leads')
            .where('created_at', '>=', startDateStr)
            .get();
        // Get bookings count
        const bookingsSnap = await db.collection('bookings')
            .where('created_at', '>=', startDateStr)
            .get();
        // Get users count
        const usersSnap = await db.collection('users')
            .where('created_at', '>=', startDateStr)
            .get();
        // Get lesson views
        const viewsSnap = await db.collection('lesson_events')
            .where('timestamp', '>=', startDateStr)
            .where('event', '==', 'view')
            .get();
        // Revenue (if payments collection exists)
        let totalRevenue = 0;
        try {
            const paymentsSnap = await db.collection('payments')
                .where('created_at', '>=', startDateStr)
                .where('status', '==', 'completed')
                .get();
            totalRevenue = paymentsSnap.docs.reduce((sum, doc) => {
                return sum + (doc.data().amount || 0);
            }, 0);
        }
        catch (_a) {
            // Payments collection may not exist
        }
        // Calculate conversion rate
        const conversionRate = leadsSnap.size > 0
            ? (bookingsSnap.size / leadsSnap.size * 100).toFixed(1)
            : '0';
        return {
            ok: true,
            metrics: {
                leads: leadsSnap.size,
                bookings: bookingsSnap.size,
                users: usersSnap.size,
                lessonViews: viewsSnap.size,
                revenue: totalRevenue,
                conversionRate: parseFloat(conversionRate)
            },
            timeRange
        };
    }
    catch (error) {
        console.error('Dashboard metrics error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get dashboard metrics');
    }
});
/**
 * Admin Referrals Overview - Get referral program stats
 */
exports.adminReferralsOverview = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    try {
        // Get all referral codes
        const codesSnap = await db.collection('referral_codes').get();
        const codes = codesSnap.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Get referral usage stats
        const usageSnap = await db.collection('referral_usage')
            .orderBy('used_at', 'desc')
            .limit(100)
            .get();
        const usage = usageSnap.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Calculate totals
        const totalReferrals = usage.length;
        const totalRewards = usage.reduce((sum, u) => sum + (u.reward_amount || 0), 0);
        return {
            ok: true,
            codes,
            recentUsage: usage.slice(0, 20),
            stats: {
                totalCodes: codes.length,
                activeCodes: codes.filter(c => c.active).length,
                totalReferrals,
                totalRewards
            }
        };
    }
    catch (error) {
        console.error('Referrals overview error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get referrals overview');
    }
});
/**
 * Admin Referrals Settings - Manage referral program settings
 */
exports.adminReferralsSettings = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    const { action, settings } = data || {};
    try {
        const settingsRef = db.collection('system').doc('referral_settings');
        if (action === 'get') {
            const doc = await settingsRef.get();
            return { ok: true, settings: doc.data() || {} };
        }
        if (action === 'update') {
            await settingsRef.set(Object.assign(Object.assign({}, settings), { updated_at: new Date().toISOString(), updated_by: context.auth.uid }), { merge: true });
            return { ok: true, message: 'Settings updated' };
        }
        throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError)
            throw error;
        console.error('Referrals settings error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to manage referral settings');
    }
});
/**
 * Admin Referrals Create - Create new referral code
 */
exports.adminReferralsCreate = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    const { code, discount, maxUses, expiresAt, description } = data || {};
    if (!code) {
        throw new functions.https.HttpsError('invalid-argument', 'Referral code required');
    }
    try {
        // Check if code already exists
        const existingDoc = await db.collection('referral_codes').doc(code).get();
        if (existingDoc.exists) {
            throw new functions.https.HttpsError('already-exists', 'Referral code already exists');
        }
        // Create new code
        await db.collection('referral_codes').doc(code).set({
            code,
            discount: discount || 10,
            maxUses: maxUses || null,
            currentUses: 0,
            expiresAt: expiresAt || null,
            description: description || '',
            active: true,
            created_at: new Date().toISOString(),
            created_by: context.auth.uid
        });
        return { ok: true, message: 'Referral code created', code };
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError)
            throw error;
        console.error('Create referral error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create referral code');
    }
});
/**
 * Content Leaderboard - Get content performance metrics
 */
exports.contentLeaderboard = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    const { type = 'all', limit = 20 } = data || {};
    try {
        // Get blogs
        let blogsQuery = db.collection('blogs')
            .orderBy('views', 'desc')
            .limit(limit);
        if (type === 'published') {
            blogsQuery = blogsQuery.where('status', '==', 'published');
        }
        const blogsSnap = await blogsQuery.get();
        const blogs = blogsSnap.docs.map(doc => (Object.assign({ id: doc.id, type: 'blog' }, doc.data())));
        // Get lessons
        const lessonsSnap = await db.collection('lessons')
            .orderBy('views', 'desc')
            .limit(limit)
            .get();
        const lessons = lessonsSnap.docs.map(doc => (Object.assign({ id: doc.id, type: 'lesson' }, doc.data())));
        const all = [...blogs, ...lessons]
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, limit);
        return {
            ok: true,
            leaderboard: all,
            blogs: blogs.slice(0, 10),
            lessons: lessons.slice(0, 10)
        };
    }
    catch (error) {
        console.error('Content leaderboard error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get content leaderboard');
    }
});
/**
 * SEO Watch - Monitor SEO metrics
 */
exports.seoWatch = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    try {
        // Get recent SEO alerts
        const alertsSnap = await db.collection('seo_alerts')
            .orderBy('created_at', 'desc')
            .limit(50)
            .get();
        const alerts = alertsSnap.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Get SEO metrics summary
        const metricsDoc = await db.collection('system').doc('seo_metrics').get();
        const metrics = metricsDoc.data() || {};
        // Get sitemap status
        const sitemapDoc = await db.collection('system').doc('sitemap').get();
        const sitemap = sitemapDoc.data() || {};
        return {
            ok: true,
            alerts,
            metrics,
            sitemap,
            unresolvedCount: alerts.filter(a => !a.resolved).length
        };
    }
    catch (error) {
        console.error('SEO watch error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get SEO data');
    }
});
/**
 * Capture Quiz Lead - Capture lead from quiz completion
 */
exports.captureQuizLead = functions.https.onCall(async (data, context) => {
    const { email, name, answers, source, referralCode } = data || {};
    if (!email) {
        throw new functions.https.HttpsError('invalid-argument', 'Email required');
    }
    try {
        // Check for existing lead
        const existingSnap = await db.collection('leads')
            .where('email', '==', email.toLowerCase())
            .limit(1)
            .get();
        if (!existingSnap.empty) {
            // Update existing lead
            const existingDoc = existingSnap.docs[0];
            await existingDoc.ref.update({
                quiz_answers: answers,
                quiz_completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            return { ok: true, leadId: existingDoc.id, isNew: false };
        }
        // Create new lead
        const leadData = {
            email: email.toLowerCase(),
            name: name || '',
            source: source || 'quiz',
            stage: 'new',
            quiz_answers: answers || [],
            referral_code: referralCode || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const docRef = await db.collection('leads').add(leadData);
        // Process referral if provided
        if (referralCode) {
            const codeDoc = await db.collection('referral_codes').doc(referralCode).get();
            if (codeDoc.exists) {
                await db.collection('referral_usage').add({
                    code: referralCode,
                    lead_id: docRef.id,
                    email: email.toLowerCase(),
                    used_at: new Date().toISOString()
                });
            }
        }
        return { ok: true, leadId: docRef.id, isNew: true };
    }
    catch (error) {
        console.error('Capture quiz lead error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to capture lead');
    }
});
//# sourceMappingURL=admin-functions.js.map