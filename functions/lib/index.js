"use strict";
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
// Firebase callable functions use the export name as the callable name.
// Since JS doesn't allow hyphens in variable names, we use bracket notation.
// Admin crosspost functions (called as 'admin-crosspost-list')
exports['admin-crosspost-list'] = admin_crosspost_list_1.adminCrosspostList;
// Admin system functions
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
// Admin CRM/leads functions
exports['api-admin-crm'] = admin_crm_1.adminCrm;
exports['api-admin-leads-list'] = api_1.list;
exports['api-admin-leads-update'] = api_1.update;
exports['api-admin-leads-export'] = api_1.exportCsv;
// Admin calendar functions
exports['api-admin-calendar-bookings'] = admin_calendar_1.getCalendarBookings;
exports['api-admin-calendar-sync'] = admin_calendar_1.syncCalendarBookings;
exports['api-admin-calendar-delete'] = admin_calendar_1.deleteCalendarBooking;
// System/config functions
exports['api-public-config'] = config_1.getPublicConfig;
exports['api-manage-secrets'] = secrets_1.manageSecrets;
// Lessons functions
exports['api-lessons-get'] = api_lessons_1.apiLessonsGet;
exports['api-lessons-continue'] = api_lessons_1.apiLessonsContinue;
exports['api-lessons-progress'] = api_lessons_1.apiLessonsProgress;
exports['api-lessons-event'] = api_lessons_1.apiLessonsEvent;
// Paywall functions
exports['api-paywall-can-watch'] = api_paywall_1.apiPaywallCanWatch;
exports['api-paywall-mark-watch'] = api_paywall_1.apiPaywallMarkWatch;
// Telemetry
exports['api-telemetry-log'] = api_paywall_1.apiTelemetryLog;
exports['api-telemetry-log-batch'] = api_paywall_1.apiTelemetryLogBatch;
// PWA functions
exports['pwa-boot'] = pwa_functions_1.pwaBoot;
exports['pwa-quiz-answer'] = pwa_functions_1.pwaQuizAnswer;
exports['pwa-ai-suggest'] = pwa_functions_1.pwaAiSuggest;
exports['pwa-coaching-recommend'] = pwa_functions_1.pwaCoachingRecommend;
exports['pwa-me-summary'] = pwa_functions_1.pwaMeSummary;
exports['pwa-me-goals'] = pwa_functions_1.pwaMeGoals;
// Admin dashboard & auth functions
exports['admin-check-role'] = admin_functions_1.adminCheckRole;
exports['admin-get-version'] = admin_functions_1.adminGetVersion;
exports['admin-bump-version'] = api_admin_1.apiAdminBumpVersion; // Also export with old name for compatibility
exports['dashboard-admin-metrics'] = admin_functions_1.dashboardAdminMetrics;
exports['admin-crm'] = admin_crm_1.adminCrm; // Also export with old name for compatibility
exports['content-leaderboard'] = admin_functions_1.contentLeaderboard;
exports['seo-watch'] = admin_functions_1.seoWatch;
exports['capture-quiz-lead'] = admin_functions_1.captureQuizLead;
// Admin referrals
exports['admin-referrals-overview'] = admin_functions_1.adminReferralsOverview;
exports['admin-referrals-settings'] = admin_functions_1.adminReferralsSettings;
exports['admin-referrals-create'] = admin_functions_1.adminReferralsCreate;
// Social media functions
exports['social-worker'] = social_functions_1.socialWorker;
exports['post-suggestions'] = social_functions_1.postSuggestions;
exports['manage-social-config'] = social_functions_1.manageSocialConfig;
exports['test-social-connection'] = social_functions_1.testSocialConnection;
exports['admin-crosspost-variants'] = social_functions_1.adminCrosspostVariants;
exports['admin-crosspost-queue'] = social_functions_1.adminCrosspostQueue;
exports['admin-crosspost-publish'] = social_functions_1.adminCrosspostPublish;
// Funnel/email functions
exports['funnel-send-email'] = funnel_functions_1.funnelSendEmail;
exports['funnel-process-queue'] = funnel_functions_1.funnelProcessQueue;
exports['funnel-campaign-create'] = funnel_functions_1.funnelCampaignCreate;
exports['funnel-campaign-list'] = funnel_functions_1.funnelCampaignList;
exports['funnel-subscribe'] = funnel_functions_1.funnelSubscribe;
exports['funnel-unsubscribe'] = funnel_functions_1.funnelUnsubscribe;
// Dashboard user functions
exports['dashboard-user-summary'] = dashboard_user_functions_1.dashboardUserSummary;
exports['dashboard-user-analytics'] = dashboard_user_functions_1.dashboardUserAnalytics;
// AI content functions
exports['ai-suggest-topics'] = ai_content_functions_1.aiSuggestTopics;
// OG image functions
exports['og-render-all'] = og_image_functions_1.ogRenderAll;
exports['og-render-single'] = og_image_functions_1.ogRenderSingle;
// Config functions with old names for compatibility
exports['getPublicConfig'] = config_1.getPublicConfig;
exports['manage-secrets'] = secrets_1.manageSecrets;
//# sourceMappingURL=index.js.map