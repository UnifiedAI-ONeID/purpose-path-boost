/**
 * Admin Dashboard & Management Functions
 * 
 * Functions for admin dashboard metrics, referrals, funnel, etc.
 */

import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

// Helper to verify admin role
async function verifyAdmin(context: functions.https.CallableContext): Promise<void> {
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
export const adminCheckRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    return { isAdmin: false };
  }

  try {
    const userDoc = await db.collection('admins').doc(context.auth.uid).get();
    const isAdmin = userDoc.exists;
    const role = userDoc.data()?.role || 'viewer';
    
    return { isAdmin, role };
  } catch (error) {
    console.error('Check role error:', error);
    return { isAdmin: false };
  }
});

/**
 * Admin Get Version - Get current app version
 */
export const adminGetVersion = functions.https.onCall(async (data, context) => {
  await verifyAdmin(context);

  try {
    const versionDoc = await db.collection('system').doc('version').get();
    const versionData = versionDoc.data() || { version: '0.0.1', updated_at: null };
    
    return { ok: true, ...versionData };
  } catch (error) {
    console.error('Get version error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get version');
  }
});

/**
 * Dashboard Admin Metrics - Get metrics for admin dashboard
 */
export const dashboardAdminMetrics = functions.https.onCall(async (data, context) => {
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
    } catch {
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
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get dashboard metrics');
  }
});

/**
 * Admin Referrals Overview - Get referral program stats
 */
export const adminReferralsOverview = functions.https.onCall(async (data, context) => {
  await verifyAdmin(context);

  try {
    // Get all referral codes
    const codesSnap = await db.collection('referral_codes').get();
    const codes = codesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{ id: string; active?: boolean; [key: string]: unknown }>;

    // Get referral usage stats
    const usageSnap = await db.collection('referral_usage')
      .orderBy('used_at', 'desc')
      .limit(100)
      .get();
    
    const usage = usageSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{ id: string; reward_amount?: number; [key: string]: unknown }>;

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
  } catch (error) {
    console.error('Referrals overview error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get referrals overview');
  }
});

/**
 * Admin Referrals Settings - Manage referral program settings
 */
export const adminReferralsSettings = functions.https.onCall(async (data, context) => {
  await verifyAdmin(context);

  const { action, settings } = data || {};

  try {
    const settingsRef = db.collection('system').doc('referral_settings');

    if (action === 'get') {
      const doc = await settingsRef.get();
      return { ok: true, settings: doc.data() || {} };
    }

    if (action === 'update') {
      await settingsRef.set({
        ...settings,
        updated_at: new Date().toISOString(),
        updated_by: context.auth!.uid
      }, { merge: true });
      return { ok: true, message: 'Settings updated' };
    }

    throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('Referrals settings error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to manage referral settings');
  }
});

/**
 * Admin Referrals Create - Create new referral code
 */
export const adminReferralsCreate = functions.https.onCall(async (data, context) => {
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
      created_by: context.auth!.uid
    });

    return { ok: true, message: 'Referral code created', code };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('Create referral error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create referral code');
  }
});

/**
 * Content Leaderboard - Get content performance metrics
 */
export const contentLeaderboard = functions.https.onCall(async (data, context) => {
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
    const blogs = blogsSnap.docs.map(doc => ({
      id: doc.id,
      type: 'blog' as const,
      ...doc.data()
    })) as Array<{ id: string; type: 'blog'; views?: number; [key: string]: unknown }>;

    // Get lessons
    const lessonsSnap = await db.collection('lessons')
      .orderBy('views', 'desc')
      .limit(limit)
      .get();
    
    const lessons = lessonsSnap.docs.map(doc => ({
      id: doc.id,
      type: 'lesson' as const,
      ...doc.data()
    })) as Array<{ id: string; type: 'lesson'; views?: number; [key: string]: unknown }>;

    // Combine and sort
    type ContentItem = { id: string; type: string; views?: number; [key: string]: unknown };
    const all: ContentItem[] = [...blogs, ...lessons]
      .sort((a, b) => ((b.views as number) || 0) - ((a.views as number) || 0))
      .slice(0, limit);

    return {
      ok: true,
      leaderboard: all,
      blogs: blogs.slice(0, 10),
      lessons: lessons.slice(0, 10)
    };
  } catch (error) {
    console.error('Content leaderboard error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get content leaderboard');
  }
});

/**
 * SEO Watch - Monitor SEO metrics
 */
export const seoWatch = functions.https.onCall(async (data, context) => {
  await verifyAdmin(context);

  try {
    // Get recent SEO alerts
    const alertsSnap = await db.collection('seo_alerts')
      .orderBy('created_at', 'desc')
      .limit(50)
      .get();
    
    const alerts = alertsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{ id: string; resolved?: boolean; [key: string]: unknown }>;

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
  } catch (error) {
    console.error('SEO watch error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get SEO data');
  }
});

/**
 * Capture Quiz Lead - Capture lead from quiz completion
 */
export const captureQuizLead = functions.https.onCall(async (data, context) => {
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
  } catch (error) {
    console.error('Capture quiz lead error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to capture lead');
  }
});
