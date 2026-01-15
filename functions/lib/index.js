"use strict";
/**
 * Firebase Functions Index
 *
 * Exports functions using nested object structure to match Firebase's dot-notation entryPoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("./api");
const admin_crm_1 = require("./admin-crm");
const admin_crosspost_list_1 = require("./admin-crosspost-list");
const admin_calendar_1 = require("./admin-calendar");
const config_1 = require("./config");
const secrets_1 = require("./internals/secrets");
// Dashboard user functions
const dashboard_user_functions_1 = require("./dashboard-user-functions");
// AI content functions
const ai_content_functions_1 = require("./ai-content-functions");
// OG image functions
const og_image_functions_1 = require("./og-image-functions");
// Admin functions
const api_admin_1 = require("./api-admin");
// Lesson functions
const api_lessons_1 = require("./api-lessons");
// Paywall and telemetry functions
const api_paywall_1 = require("./api-paywall");
// PWA functions
const pwa_functions_1 = require("./pwa-functions");
// Admin dashboard functions
const admin_functions_1 = require("./admin-functions");
// Social media functions
const social_functions_1 = require("./social-functions");
// Funnel functions
const funnel_functions_1 = require("./funnel-functions");
/**
 * Export functions using nested object structure for Firebase's dot-notation entryPoints
 * Use exports.xxx format (CommonJS) instead of export const (ES6)
 */
// Create nested export structure
exports.admin = {
    crosspost: {
        list: admin_crosspost_list_1.adminCrosspostList,
        variants: social_functions_1.adminCrosspostVariants,
        queue: social_functions_1.adminCrosspostQueue,
        publish: social_functions_1.adminCrosspostPublish,
    },
    check: {
        role: admin_functions_1.adminCheckRole,
    },
    get: {
        version: admin_functions_1.adminGetVersion,
    },
    bump: {
        version: api_admin_1.apiAdminBumpVersion,
    },
    crm: admin_crm_1.adminCrm,
    referrals: {
        overview: admin_functions_1.adminReferralsOverview,
        settings: admin_functions_1.adminReferralsSettings,
        create: admin_functions_1.adminReferralsCreate,
    },
};
exports.api = {
    admin: {
        bump: { version: api_admin_1.apiAdminBumpVersion },
        seo: {
            alert: api_admin_1.apiAdminSeoAlert,
            resolve: api_admin_1.apiAdminSeoResolve,
        },
        blog: {
            list: api_admin_1.apiAdminBlogList,
            delete: api_admin_1.apiAdminBlogDelete,
        },
        cache: { bust: api_admin_1.apiAdminCacheBust },
        sitemap: { rebuild: api_admin_1.apiAdminSitemapRebuild },
        fx: {
            rates: api_admin_1.apiAdminFxRates,
            update: api_admin_1.apiAdminFxUpdate,
        },
        calendar: {
            feed: api_admin_1.apiAdminCalendarFeed,
            bookings: admin_calendar_1.getCalendarBookings,
            sync: admin_calendar_1.syncCalendarBookings,
            delete: admin_calendar_1.deleteCalendarBooking,
        },
        metrics: { summary: api_admin_1.apiAdminMetricsSummary },
        crm: admin_crm_1.adminCrm,
        leads: {
            list: api_1.list,
            update: api_1.update,
            export: api_1.exportCsv,
        },
    },
    public: { config: config_1.getPublicConfig },
    manage: { secrets: secrets_1.manageSecrets },
    lessons: {
        get: api_lessons_1.apiLessonsGet,
        continue: api_lessons_1.apiLessonsContinue,
        progress: api_lessons_1.apiLessonsProgress,
        event: api_lessons_1.apiLessonsEvent,
    },
    paywall: {
        can: { watch: api_paywall_1.apiPaywallCanWatch },
        mark: { watch: api_paywall_1.apiPaywallMarkWatch },
    },
    telemetry: {
        log: api_paywall_1.apiTelemetryLog,
        logBatch: api_paywall_1.apiTelemetryLogBatch,
    },
};
exports.pwa = {
    boot: pwa_functions_1.pwaBoot,
    quiz: { answer: pwa_functions_1.pwaQuizAnswer },
    ai: { suggest: pwa_functions_1.pwaAiSuggest },
    coaching: { recommend: pwa_functions_1.pwaCoachingRecommend },
    me: {
        summary: pwa_functions_1.pwaMeSummary,
        goals: pwa_functions_1.pwaMeGoals,
    },
};
exports.dashboard = {
    admin: { metrics: admin_functions_1.dashboardAdminMetrics },
    user: {
        summary: dashboard_user_functions_1.dashboardUserSummary,
        analytics: dashboard_user_functions_1.dashboardUserAnalytics,
    },
};
exports.social = {
    worker: social_functions_1.socialWorker,
};
exports.post = {
    suggestions: social_functions_1.postSuggestions,
};
exports.manage = {
    social: { config: social_functions_1.manageSocialConfig },
    secrets: secrets_1.manageSecrets,
};
exports.test = {
    social: { connection: social_functions_1.testSocialConnection },
};
exports.funnel = {
    send: { email: funnel_functions_1.funnelSendEmail },
    process: { queue: funnel_functions_1.funnelProcessQueue },
    campaign: {
        create: funnel_functions_1.funnelCampaignCreate,
        list: funnel_functions_1.funnelCampaignList,
    },
    subscribe: funnel_functions_1.funnelSubscribe,
    unsubscribe: funnel_functions_1.funnelUnsubscribe,
};
exports.content = {
    leaderboard: admin_functions_1.contentLeaderboard,
};
exports.seo = {
    watch: admin_functions_1.seoWatch,
};
exports.capture = {
    quiz: { lead: admin_functions_1.captureQuizLead },
};
exports.ai = {
    suggest: { topics: ai_content_functions_1.aiSuggestTopics },
};
exports.og = {
    render: {
        all: og_image_functions_1.ogRenderAll,
        single: og_image_functions_1.ogRenderSingle,
    },
};
// Simple top-level exports for functions without hyphens
exports.getPublicConfig = config_1.getPublicConfig;
// ============================================================================
// DUAL EXPORTS: Add hyphenated bracket notation for 1st Gen Cloud Functions
// These exports allow 1st Gen runtime to find functions using their original
// hyphenated names while maintaining nested structure for 2nd Gen functions
// ============================================================================
// Admin crosspost functions
exports['admin-crosspost-list'] = admin_crosspost_list_1.adminCrosspostList;
exports['admin-crosspost-variants'] = social_functions_1.adminCrosspostVariants;
exports['admin-crosspost-queue'] = social_functions_1.adminCrosspostQueue;
exports['admin-crosspost-publish'] = social_functions_1.adminCrosspostPublish;
// Admin check and version functions
exports['admin-check-role'] = admin_functions_1.adminCheckRole;
exports['admin-get-version'] = admin_functions_1.adminGetVersion;
exports['admin-bump-version'] = api_admin_1.apiAdminBumpVersion;
// Admin CRM and referrals
exports['admin-crm'] = admin_crm_1.adminCrm;
exports['admin-referrals-overview'] = admin_functions_1.adminReferralsOverview;
exports['admin-referrals-settings'] = admin_functions_1.adminReferralsSettings;
exports['admin-referrals-create'] = admin_functions_1.adminReferralsCreate;
// API admin functions
exports['api-admin-bump-version'] = api_admin_1.apiAdminBumpVersion;
exports['api-admin-seo-alert'] = api_admin_1.apiAdminSeoAlert;
exports['api-admin-seo-resolve'] = api_admin_1.apiAdminSeoResolve;
exports['api-admin-blog-list'] = api_admin_1.apiAdminBlogList;
exports['api-admin-blog-delete'] = api_admin_1.apiAdminBlogDelete;
exports['api-admin-cache-bust'] = api_admin_1.apiAdminCacheBust;
exports['api-admin-sitemap-rebuild'] = api_admin_1.apiAdminSitemapRebuild;
exports['api-admin-fx-rates'] = api_admin_1.apiAdminFxRates;
exports['api-admin-fx-update'] = api_admin_1.apiAdminFxUpdate;
exports['api-admin-calendar-feed'] = api_admin_1.apiAdminCalendarFeed;
exports['api-admin-metrics-summary'] = api_admin_1.apiAdminMetricsSummary;
exports['api-admin-crm'] = admin_crm_1.adminCrm;
// API admin leads functions (2nd Gen, but add for consistency)
exports['api-admin-leads-list'] = api_1.list;
exports['api-admin-leads-update'] = api_1.update;
exports['api-admin-leads-export'] = api_1.exportCsv;
// API admin calendar functions (2nd Gen, but add for consistency)
exports['api-admin-calendar-bookings'] = admin_calendar_1.getCalendarBookings;
exports['api-admin-calendar-sync'] = admin_calendar_1.syncCalendarBookings;
exports['api-admin-calendar-delete'] = admin_calendar_1.deleteCalendarBooking;
// Config and secrets
exports['api-public-config'] = config_1.getPublicConfig;
exports['api-manage-secrets'] = secrets_1.manageSecrets;
// Lessons functions
exports['api-lessons-get'] = api_lessons_1.apiLessonsGet;
exports['api-lessons-continue'] = api_lessons_1.apiLessonsContinue;
exports['api-lessons-progress'] = api_lessons_1.apiLessonsProgress;
exports['api-lessons-event'] = api_lessons_1.apiLessonsEvent;
// Paywall functions (2nd Gen, but add for consistency)
exports['api-paywall-can-watch'] = api_paywall_1.apiPaywallCanWatch;
exports['api-paywall-mark-watch'] = api_paywall_1.apiPaywallMarkWatch;
// Telemetry functions (2nd Gen, but add for consistency)
exports['api-telemetry-log'] = api_paywall_1.apiTelemetryLog;
exports['api-telemetry-log-batch'] = api_paywall_1.apiTelemetryLogBatch;
// PWA functions
exports['pwa-boot'] = pwa_functions_1.pwaBoot;
exports['pwa-quiz-answer'] = pwa_functions_1.pwaQuizAnswer;
exports['pwa-ai-suggest'] = pwa_functions_1.pwaAiSuggest;
exports['pwa-coaching-recommend'] = pwa_functions_1.pwaCoachingRecommend;
exports['pwa-me-summary'] = pwa_functions_1.pwaMeSummary;
exports['pwa-me-goals'] = pwa_functions_1.pwaMeGoals;
// Dashboard functions
exports['dashboard-admin-metrics'] = admin_functions_1.dashboardAdminMetrics;
exports['dashboard-user-summary'] = dashboard_user_functions_1.dashboardUserSummary;
exports['dashboard-user-analytics'] = dashboard_user_functions_1.dashboardUserAnalytics;
// Social media functions
exports['social-worker'] = social_functions_1.socialWorker;
exports['post-suggestions'] = social_functions_1.postSuggestions;
exports['manage-social-config'] = social_functions_1.manageSocialConfig;
exports['test-social-connection'] = social_functions_1.testSocialConnection;
// Funnel/email functions
exports['funnel-send-email'] = funnel_functions_1.funnelSendEmail;
exports['funnel-process-queue'] = funnel_functions_1.funnelProcessQueue;
exports['funnel-campaign-create'] = funnel_functions_1.funnelCampaignCreate;
exports['funnel-campaign-list'] = funnel_functions_1.funnelCampaignList;
exports['funnel-subscribe'] = funnel_functions_1.funnelSubscribe;
exports['funnel-unsubscribe'] = funnel_functions_1.funnelUnsubscribe;
// Content and SEO functions
exports['content-leaderboard'] = admin_functions_1.contentLeaderboard;
exports['seo-watch'] = admin_functions_1.seoWatch;
// Capture functions
exports['capture-quiz-lead'] = admin_functions_1.captureQuizLead;
// AI functions
exports['ai-suggest-topics'] = ai_content_functions_1.aiSuggestTopics;
// OG image functions
exports['og-render-all'] = og_image_functions_1.ogRenderAll;
exports['og-render-single'] = og_image_functions_1.ogRenderSingle;
//# sourceMappingURL=index.js.map