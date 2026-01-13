"use strict";
/**
 * Social Media & Crosspost Functions
 *
 * Functions for social media automation, crossposts, and suggestions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCrosspostPublish = exports.adminCrosspostQueue = exports.adminCrosspostVariants = exports.testSocialConnection = exports.manageSocialConfig = exports.postSuggestions = exports.socialWorker = void 0;
const functions = require("firebase-functions");
const firebase_init_1 = require("./firebase-init");
// Helper to verify admin role
async function verifyAdmin(context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userDoc = await firebase_init_1.db.collection('admins').doc(context.auth.uid).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }
}
/**
 * Social Worker - Trigger social media automation
 */
exports.socialWorker = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    const { action, contentId, platforms, scheduledAt } = data || {};
    try {
        switch (action) {
            case 'publish': {
                // Immediate publish to selected platforms
                const results = await publishToSocial(contentId, platforms);
                return { ok: true, results };
            }
            case 'schedule': {
                // Schedule for later
                await firebase_init_1.db.collection('social_queue').add({
                    contentId,
                    platforms,
                    scheduled_at: scheduledAt,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    created_by: context.auth.uid
                });
                return { ok: true, message: 'Scheduled for publishing' };
            }
            case 'preview': {
                // Generate preview for platforms
                const previews = await generateSocialPreviews(contentId, platforms);
                return { ok: true, previews };
            }
            default:
                throw new functions.https.HttpsError('invalid-argument', `Unknown action: ${action}`);
        }
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError)
            throw error;
        console.error('Social worker error:', error);
        throw new functions.https.HttpsError('internal', 'Social automation failed');
    }
});
/**
 * Post Suggestions - AI-powered post suggestions
 */
exports.postSuggestions = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    const { topic, platform, tone, contentType } = data || {};
    try {
        // Generate suggestions based on input
        const suggestions = generatePostSuggestions(topic, platform, tone, contentType);
        // Log suggestion request
        await firebase_init_1.db.collection('ai_suggestions_log').add({
            input: { topic, platform, tone, contentType },
            suggestions,
            created_at: new Date().toISOString(),
            created_by: context.auth.uid
        });
        return { ok: true, suggestions };
    }
    catch (error) {
        console.error('Post suggestions error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to generate suggestions');
    }
});
/**
 * Manage Social Config - CRUD for social media configurations
 */
exports.manageSocialConfig = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    const { action, platform, config } = data || {};
    const configRef = firebase_init_1.db.collection('social_config');
    try {
        switch (action) {
            case 'list': {
                const snap = await configRef.get();
                const configs = snap.docs.map(doc => (Object.assign({ platform: doc.id }, doc.data())));
                return { ok: true, configs };
            }
            case 'get': {
                if (!platform) {
                    throw new functions.https.HttpsError('invalid-argument', 'Platform required');
                }
                const doc = await configRef.doc(platform).get();
                return { ok: true, config: doc.exists ? Object.assign({ platform }, doc.data()) : null };
            }
            case 'update': {
                if (!platform || !config) {
                    throw new functions.https.HttpsError('invalid-argument', 'Platform and config required');
                }
                await configRef.doc(platform).set(Object.assign(Object.assign({}, config), { updated_at: new Date().toISOString(), updated_by: context.auth.uid }), { merge: true });
                return { ok: true, message: 'Config updated' };
            }
            case 'delete': {
                if (!platform) {
                    throw new functions.https.HttpsError('invalid-argument', 'Platform required');
                }
                await configRef.doc(platform).delete();
                return { ok: true, message: 'Config deleted' };
            }
            default:
                throw new functions.https.HttpsError('invalid-argument', `Unknown action: ${action}`);
        }
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError)
            throw error;
        console.error('Manage social config error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to manage social config');
    }
});
/**
 * Test Social Connection - Test connection to social platform
 */
exports.testSocialConnection = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    const { platform } = data || {};
    if (!platform) {
        throw new functions.https.HttpsError('invalid-argument', 'Platform required');
    }
    try {
        // Get platform config
        const configDoc = await firebase_init_1.db.collection('social_config').doc(platform).get();
        if (!configDoc.exists) {
            return { ok: false, error: 'Platform not configured' };
        }
        const config = configDoc.data();
        // Test connection based on platform
        const result = await testPlatformConnection(platform, config);
        return { ok: result.success, message: result.message, details: result.details };
    }
    catch (error) {
        console.error('Test social connection error:', error);
        return { ok: false, error: 'Connection test failed' };
    }
});
/**
 * Admin Crosspost Variants - Generate crosspost variants
 */
exports.adminCrosspostVariants = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    const { contentId, platforms } = data || {};
    if (!contentId) {
        throw new functions.https.HttpsError('invalid-argument', 'Content ID required');
    }
    try {
        // Get original content
        const contentDoc = await firebase_init_1.db.collection('blogs').doc(contentId).get();
        if (!contentDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Content not found');
        }
        const content = contentDoc.data();
        // Generate variants for each platform
        const variants = (platforms || ['twitter', 'linkedin', 'instagram']).map((platform) => ({
            platform,
            text: generatePlatformVariant(content, platform),
            charCount: 0,
            hashtags: generateHashtags(content, platform)
        }));
        // Update char counts
        variants.forEach((v) => {
            v.charCount = v.text.length;
        });
        return { ok: true, variants };
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError)
            throw error;
        console.error('Crosspost variants error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to generate variants');
    }
});
/**
 * Admin Crosspost Queue - Queue crossposts for publishing
 */
exports.adminCrosspostQueue = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    const { contentId, posts, scheduledAt } = data || {};
    if (!contentId || !(posts === null || posts === void 0 ? void 0 : posts.length)) {
        throw new functions.https.HttpsError('invalid-argument', 'Content ID and posts required');
    }
    try {
        const batch = firebase_init_1.db.batch();
        const queueRef = firebase_init_1.db.collection('crosspost_queue');
        for (const post of posts) {
            const docRef = queueRef.doc();
            batch.set(docRef, {
                content_id: contentId,
                platform: post.platform,
                text: post.text,
                media: post.media || [],
                scheduled_at: scheduledAt || null,
                status: scheduledAt ? 'scheduled' : 'pending',
                created_at: new Date().toISOString(),
                created_by: context.auth.uid
            });
        }
        await batch.commit();
        return { ok: true, message: `${posts.length} posts queued` };
    }
    catch (error) {
        console.error('Crosspost queue error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to queue crossposts');
    }
});
/**
 * Admin Crosspost Publish - Publish a queued crosspost
 */
exports.adminCrosspostPublish = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    const { queueId } = data || {};
    if (!queueId) {
        throw new functions.https.HttpsError('invalid-argument', 'Queue ID required');
    }
    try {
        const queueDoc = await firebase_init_1.db.collection('crosspost_queue').doc(queueId).get();
        if (!queueDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Queued post not found');
        }
        const queueData = queueDoc.data();
        // Attempt to publish
        const result = await publishToPlatform(queueData.platform, queueData.text, queueData.media);
        // Update queue status
        await queueDoc.ref.update({
            status: result.success ? 'published' : 'failed',
            published_at: result.success ? new Date().toISOString() : null,
            error: result.success ? null : result.error,
            platform_post_id: result.postId || null
        });
        return { ok: result.success, message: result.message, postId: result.postId };
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError)
            throw error;
        console.error('Crosspost publish error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to publish crosspost');
    }
});
// Helper functions
async function publishToSocial(contentId, platforms) {
    // Placeholder for actual social media API integration
    return platforms.map(p => ({ platform: p, success: true, postId: `${p}_${Date.now()}` }));
}
async function generateSocialPreviews(contentId, platforms) {
    // Generate preview text for each platform
    return platforms.map(p => ({
        platform: p,
        preview: `Preview for ${p}`,
        charLimit: p === 'twitter' ? 280 : p === 'linkedin' ? 3000 : 2200
    }));
}
function generatePostSuggestions(topic, platform, tone, contentType) {
    // Placeholder for AI-generated suggestions
    const baseTopic = topic || 'career growth';
    return [
        `🚀 Ready to level up your ${baseTopic}? Here's what successful professionals do differently...`,
        `The secret to mastering ${baseTopic} isn't what you think. Let me share what I've learned...`,
        `3 mistakes holding you back from achieving ${baseTopic} - and how to fix them today`
    ];
}
async function testPlatformConnection(platform, config) {
    // Placeholder for actual API testing
    return {
        success: true,
        message: `Successfully connected to ${platform}`,
        details: { accountName: (config === null || config === void 0 ? void 0 : config.accountName) || 'Unknown' }
    };
}
function generatePlatformVariant(content, platform) {
    var _a;
    const title = (content === null || content === void 0 ? void 0 : content.title) || 'Untitled';
    const excerpt = (content === null || content === void 0 ? void 0 : content.excerpt) || ((_a = content === null || content === void 0 ? void 0 : content.content) === null || _a === void 0 ? void 0 : _a.slice(0, 100)) || '';
    switch (platform) {
        case 'twitter':
            return `${title}\n\n${excerpt.slice(0, 180)}...`;
        case 'linkedin':
            return `${title}\n\n${excerpt}\n\n#CareerGrowth #ProfessionalDevelopment`;
        case 'instagram':
            return `✨ ${title}\n\n${excerpt}\n\n.\n.\n.\n#coaching #growth #mindset`;
        default:
            return `${title}\n\n${excerpt}`;
    }
}
function generateHashtags(content, platform) {
    const baseTags = ['coaching', 'growth', 'career'];
    const tags = (content === null || content === void 0 ? void 0 : content.tags) || baseTags;
    if (platform === 'instagram') {
        return [...tags, 'motivation', 'success', 'mindset'].slice(0, 30);
    }
    return tags.slice(0, 5);
}
async function publishToPlatform(platform, text, media) {
    // Placeholder for actual publishing logic
    return {
        success: true,
        message: `Published to ${platform}`,
        postId: `${platform}_${Date.now()}`
    };
}
//# sourceMappingURL=social-functions.js.map