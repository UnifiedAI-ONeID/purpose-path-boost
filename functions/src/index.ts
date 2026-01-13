import { list, update, exportCsv } from './api';
import { adminCrm } from './admin-crm';
import { adminCrosspostList } from './admin-crosspost-list';
import { getCalendarBookings, syncCalendarBookings, deleteCalendarBooking } from './admin-calendar';
import { getPublicConfig } from './config';
import { manageSecrets } from './internals/secrets';

// Dashboard user functions
import {
  dashboardUserSummary,
  dashboardUserAnalytics,
} from './dashboard-user-functions';

// AI content functions
import { aiSuggestTopics } from './ai-content-functions';

// OG image functions
import { ogRenderAll, ogRenderSingle } from './og-image-functions';

// Admin functions
import {
  apiAdminBumpVersion,
  apiAdminSeoAlert,
  apiAdminBlogList,
  apiAdminBlogDelete,
  apiAdminCacheBust,
  apiAdminSitemapRebuild,
  apiAdminSeoResolve,
  apiAdminFxRates,
  apiAdminFxUpdate,
  apiAdminCalendarFeed,
  apiAdminMetricsSummary,
} from './api-admin';

// Lesson functions
import {
  apiLessonsGet,
  apiLessonsContinue,
  apiLessonsProgress,
  apiLessonsEvent,
} from './api-lessons';

// Paywall and telemetry functions
import {
  apiPaywallCanWatch,
  apiPaywallMarkWatch,
  apiTelemetryLog,
  apiTelemetryLogBatch,
} from './api-paywall';

// PWA functions
import {
  pwaBoot,
  pwaQuizAnswer,
  pwaAiSuggest,
  pwaCoachingRecommend,
  pwaMeSummary,
  pwaMeGoals,
} from './pwa-functions';

// Admin dashboard functions
import {
  adminCheckRole,
  adminGetVersion,
  dashboardAdminMetrics,
  adminReferralsOverview,
  adminReferralsSettings,
  adminReferralsCreate,
  contentLeaderboard,
  seoWatch,
  captureQuizLead,
} from './admin-functions';

// Social media functions
import {
  socialWorker,
  postSuggestions,
  manageSocialConfig,
  testSocialConnection,
  adminCrosspostVariants,
  adminCrosspostQueue,
  adminCrosspostPublish,
} from './social-functions';

// Funnel functions
import {
  funnelSendEmail,
  funnelProcessQueue,
  funnelCampaignCreate,
  funnelCampaignList,
  funnelSubscribe,
  funnelUnsubscribe,
} from './funnel-functions';

// Firebase callable functions use the export name as the callable name.
// Since JS doesn't allow hyphens in variable names, we use bracket notation.

// Admin crosspost functions (called as 'admin-crosspost-list')
exports['admin-crosspost-list'] = adminCrosspostList;

// Admin system functions
exports['api-admin-bump-version'] = apiAdminBumpVersion;
exports['api-admin-seo-alert'] = apiAdminSeoAlert;
exports['api-admin-seo-resolve'] = apiAdminSeoResolve;
exports['api-admin-blog-list'] = apiAdminBlogList;
exports['api-admin-blog-delete'] = apiAdminBlogDelete;
exports['api-admin-cache-bust'] = apiAdminCacheBust;
exports['api-admin-sitemap-rebuild'] = apiAdminSitemapRebuild;
exports['api-admin-fx-rates'] = apiAdminFxRates;
exports['api-admin-fx-update'] = apiAdminFxUpdate;
exports['api-admin-calendar-feed'] = apiAdminCalendarFeed;
exports['api-admin-metrics-summary'] = apiAdminMetricsSummary;

// Admin CRM/leads functions
exports['api-admin-crm'] = adminCrm;
exports['api-admin-leads-list'] = list;
exports['api-admin-leads-update'] = update;
exports['api-admin-leads-export'] = exportCsv;

// Admin calendar functions
exports['api-admin-calendar-bookings'] = getCalendarBookings;
exports['api-admin-calendar-sync'] = syncCalendarBookings;
exports['api-admin-calendar-delete'] = deleteCalendarBooking;

// System/config functions
exports['api-public-config'] = getPublicConfig;
exports['api-manage-secrets'] = manageSecrets;

// Lessons functions
exports['api-lessons-get'] = apiLessonsGet;
exports['api-lessons-continue'] = apiLessonsContinue;
exports['api-lessons-progress'] = apiLessonsProgress;
exports['api-lessons-event'] = apiLessonsEvent;

// Paywall functions
exports['api-paywall-can-watch'] = apiPaywallCanWatch;
exports['api-paywall-mark-watch'] = apiPaywallMarkWatch;

// Telemetry
exports['api-telemetry-log'] = apiTelemetryLog;
exports['api-telemetry-log-batch'] = apiTelemetryLogBatch;

// PWA functions
exports['pwa-boot'] = pwaBoot;
exports['pwa-quiz-answer'] = pwaQuizAnswer;
exports['pwa-ai-suggest'] = pwaAiSuggest;
exports['pwa-coaching-recommend'] = pwaCoachingRecommend;
exports['pwa-me-summary'] = pwaMeSummary;
exports['pwa-me-goals'] = pwaMeGoals;

// Admin dashboard & auth functions
exports['admin-check-role'] = adminCheckRole;
exports['admin-get-version'] = adminGetVersion;
exports['admin-bump-version'] = apiAdminBumpVersion; // Also export with old name for compatibility
exports['dashboard-admin-metrics'] = dashboardAdminMetrics;
exports['admin-crm'] = adminCrm; // Also export with old name for compatibility
exports['content-leaderboard'] = contentLeaderboard;
exports['seo-watch'] = seoWatch;
exports['capture-quiz-lead'] = captureQuizLead;

// Admin referrals
exports['admin-referrals-overview'] = adminReferralsOverview;
exports['admin-referrals-settings'] = adminReferralsSettings;
exports['admin-referrals-create'] = adminReferralsCreate;

// Social media functions
exports['social-worker'] = socialWorker;
exports['post-suggestions'] = postSuggestions;
exports['manage-social-config'] = manageSocialConfig;
exports['test-social-connection'] = testSocialConnection;
exports['admin-crosspost-variants'] = adminCrosspostVariants;
exports['admin-crosspost-queue'] = adminCrosspostQueue;
exports['admin-crosspost-publish'] = adminCrosspostPublish;

// Funnel/email functions
exports['funnel-send-email'] = funnelSendEmail;
exports['funnel-process-queue'] = funnelProcessQueue;
exports['funnel-campaign-create'] = funnelCampaignCreate;
exports['funnel-campaign-list'] = funnelCampaignList;
exports['funnel-subscribe'] = funnelSubscribe;
exports['funnel-unsubscribe'] = funnelUnsubscribe;

// Dashboard user functions
exports['dashboard-user-summary'] = dashboardUserSummary;
exports['dashboard-user-analytics'] = dashboardUserAnalytics;

// AI content functions
exports['ai-suggest-topics'] = aiSuggestTopics;

// OG image functions
exports['og-render-all'] = ogRenderAll;
exports['og-render-single'] = ogRenderSingle;

// Config functions with old names for compatibility
exports['getPublicConfig'] = getPublicConfig;
exports['manage-secrets'] = manageSecrets;
