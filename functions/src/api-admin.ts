import * as functions from 'firebase-functions';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase-init';

// Helper to check admin auth
function requireAdmin(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  const roles = context.auth.token.roles as string[] | undefined;
  if (!roles?.includes('admin')) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
}

/**
 * Bump the cache/content version to force client refresh
 */
export const apiAdminBumpVersion = functions.https.onCall(async (data, context) => {
  requireAdmin(context);
  
  try {
    const version = Date.now().toString();
    await db.collection('_system').doc('config').set({
      content_version: version,
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true });
    
    return { ok: true, version };
  } catch (error) {
    console.error('[api-admin-bump-version] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to bump version');
  }
});

/**
 * Queue an SEO alert for admin notification
 */
export const apiAdminSeoAlert = functions.https.onCall(async (data, context) => {
  requireAdmin(context);
  
  const { message, expire_at } = data;
  
  if (!message) {
    throw new functions.https.HttpsError('invalid-argument', 'Message is required');
  }
  
  try {
    await db.collection('seo_alerts').add({
      message,
      expire_at: expire_at || null,
      resolved: false,
      created_at: FieldValue.serverTimestamp(),
      created_by: context.auth!.uid,
    });
    
    return { ok: true };
  } catch (error) {
    console.error('[api-admin-seo-alert] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to queue SEO alert');
  }
});

/**
 * List all blog posts for admin
 */
export const apiAdminBlogList = functions.https.onCall(async (data, context) => {
  requireAdmin(context);
  
  try {
    const snapshot = await db.collection('blog_posts')
      .orderBy('created_at', 'desc')
      .limit(100)
      .get();
    
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return { ok: true, posts };
  } catch (error) {
    console.error('[api-admin-blog-list] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to list blog posts');
  }
});

/**
 * Delete a blog post
 */
export const apiAdminBlogDelete = functions.https.onCall(async (data, context) => {
  requireAdmin(context);
  
  const { id } = data;
  
  if (!id) {
    throw new functions.https.HttpsError('invalid-argument', 'Blog post ID is required');
  }
  
  try {
    await db.collection('blog_posts').doc(id).delete();
    return { ok: true };
  } catch (error) {
    console.error('[api-admin-blog-delete] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete blog post');
  }
});

/**
 * Bust the CDN/browser cache
 */
export const apiAdminCacheBust = functions.https.onCall(async (data, context) => {
  requireAdmin(context);
  
  try {
    const version = Date.now().toString();
    await db.collection('_system').doc('cache').set({
      bust_version: version,
      busted_at: FieldValue.serverTimestamp(),
      busted_by: context.auth!.uid,
    }, { merge: true });
    
    return { ok: true, version };
  } catch (error) {
    console.error('[api-admin-cache-bust] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to bust cache');
  }
});

/**
 * Trigger sitemap rebuild
 */
export const apiAdminSitemapRebuild = functions.https.onCall(async (data, context) => {
  requireAdmin(context);
  
  try {
    // Get all published blog posts and pages
    const [blogsSnap, pagesSnap] = await Promise.all([
      db.collection('blog_posts').where('status', '==', 'published').get(),
      db.collection('pages').where('status', '==', 'published').get(),
    ]);
    
    const urls: string[] = [];
    const baseUrl = 'https://zhengrowth.com';
    
    // Add static pages
    urls.push(baseUrl);
    urls.push(`${baseUrl}/about`);
    urls.push(`${baseUrl}/coaching`);
    urls.push(`${baseUrl}/programs`);
    urls.push(`${baseUrl}/contact`);
    
    // Add blog posts
    blogsSnap.docs.forEach(doc => {
      const slug = doc.data().slug || doc.id;
      urls.push(`${baseUrl}/blog/${slug}`);
    });
    
    // Add pages
    pagesSnap.docs.forEach(doc => {
      const slug = doc.data().slug || doc.id;
      urls.push(`${baseUrl}/${slug}`);
    });
    
    // Store sitemap data
    await db.collection('_system').doc('sitemap').set({
      urls,
      rebuilt_at: FieldValue.serverTimestamp(),
      rebuilt_by: context.auth!.uid,
      url_count: urls.length,
    });
    
    return { ok: true, url_count: urls.length };
  } catch (error) {
    console.error('[api-admin-sitemap-rebuild] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to rebuild sitemap');
  }
});

/**
 * Resolve an SEO alert
 */
export const apiAdminSeoResolve = functions.https.onCall(async (data, context) => {
  requireAdmin(context);
  
  const { id } = data;
  
  if (!id) {
    throw new functions.https.HttpsError('invalid-argument', 'Alert ID is required');
  }
  
  try {
    await db.collection('seo_alerts').doc(id).update({
      resolved: true,
      resolved_at: FieldValue.serverTimestamp(),
      resolved_by: context.auth!.uid,
    });
    
    return { ok: true };
  } catch (error) {
    console.error('[api-admin-seo-resolve] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to resolve SEO alert');
  }
});

/**
 * Get FX rates for currency audit
 */
export const apiAdminFxRates = functions.https.onCall(async (data, context) => {
  requireAdmin(context);
  
  try {
    const doc = await db.collection('_system').doc('fx_rates').get();
    const rates = doc.exists ? doc.data() : { USD: 1, CNY: 7.2, EUR: 0.92 };
    
    return { ok: true, rates };
  } catch (error) {
    console.error('[api-admin-fx-rates] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get FX rates');
  }
});

/**
 * Update FX rates
 */
export const apiAdminFxUpdate = functions.https.onCall(async (data, context) => {
  requireAdmin(context);
  
  const { rates } = data;
  
  if (!rates || typeof rates !== 'object') {
    throw new functions.https.HttpsError('invalid-argument', 'Rates object is required');
  }
  
  try {
    await db.collection('_system').doc('fx_rates').set({
      ...rates,
      updated_at: FieldValue.serverTimestamp(),
      updated_by: context.auth!.uid,
    });
    
    return { ok: true };
  } catch (error) {
    console.error('[api-admin-fx-update] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update FX rates');
  }
});

/**
 * Get calendar feed for admin overview
 */
export const apiAdminCalendarFeed = functions.https.onCall(async (data, context) => {
  requireAdmin(context);
  
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const snapshot = await db.collection('bookings')
      .where('start_time', '>=', thirtyDaysAgo)
      .where('start_time', '<=', thirtyDaysFromNow)
      .orderBy('start_time', 'asc')
      .get();
    
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return { ok: true, events };
  } catch (error) {
    console.error('[api-admin-calendar-feed] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get calendar feed');
  }
});

/**
 * Get metrics summary for dashboard
 */
export const apiAdminMetricsSummary = functions.https.onCall(async (data, context) => {
  requireAdmin(context);
  
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get counts from various collections
    const [usersSnap, leadsSnap, bookingsSnap, lessonsSnap] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('leads').where('created_at', '>=', thirtyDaysAgo).count().get(),
      db.collection('bookings').where('created_at', '>=', thirtyDaysAgo).count().get(),
      db.collection('lesson_progress').where('updated_at', '>=', thirtyDaysAgo).count().get(),
    ]);
    
    return {
      ok: true,
      metrics: {
        total_users: usersSnap.data().count,
        new_leads_30d: leadsSnap.data().count,
        bookings_30d: bookingsSnap.data().count,
        lessons_watched_30d: lessonsSnap.data().count,
      },
    };
  } catch (error) {
    console.error('[api-admin-metrics-summary] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get metrics summary');
  }
});
