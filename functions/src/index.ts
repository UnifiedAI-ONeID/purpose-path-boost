/**
 * Firebase Functions Index
 * 
 * Exports functions using nested object structure to match Firebase's dot-notation entryPoints
 */

import { list, update, exportCsv } from './api';
import { adminCrm } from './admin-crm';
import { adminCrosspostList } from './admin-crosspost-list';
import { getCalendarBookings, syncCalendarBookings, deleteCalendarBooking } from './admin-calendar';
import { getPublicConfig as getConfig } from './config';
import { manageSecrets as secrets } from './internals/secrets';

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

/**
 * Export functions using nested object structure for Firebase's dot-notation entryPoints
 * Use exports.xxx format (CommonJS) instead of export const (ES6)
 */

// Create nested export structure
exports.admin = {
  crosspost: {
    list: adminCrosspostList,
    variants: adminCrosspostVariants,
    queue: adminCrosspostQueue,
    publish: adminCrosspostPublish,
  },
  check: {
    role: adminCheckRole,
  },
  get: {
    version: adminGetVersion,
  },
  bump: {
    version: apiAdminBumpVersion,
  },
  crm: adminCrm,
  referrals: {
    overview: adminReferralsOverview,
    settings: adminReferralsSettings,
    create: adminReferralsCreate,
  },
};

exports.api = {
  admin: {
    bump: { version: apiAdminBumpVersion },
    seo: {
      alert: apiAdminSeoAlert,
      resolve: apiAdminSeoResolve,
    },
    blog: {
      list: apiAdminBlogList,
      delete: apiAdminBlogDelete,
    },
    cache: { bust: apiAdminCacheBust },
    sitemap: { rebuild: apiAdminSitemapRebuild },
    fx: {
      rates: apiAdminFxRates,
      update: apiAdminFxUpdate,
    },
    calendar: {
      feed: apiAdminCalendarFeed,
      bookings: getCalendarBookings,
      sync: syncCalendarBookings,
      delete: deleteCalendarBooking,
    },
    metrics: { summary: apiAdminMetricsSummary },
    crm: adminCrm,
    leads: {
      list,
      update,
      export: exportCsv,
    },
  },
  public: { config: getConfig },
  manage: { secrets },
  lessons: {
    get: apiLessonsGet,
    continue: apiLessonsContinue,
    progress: apiLessonsProgress,
    event: apiLessonsEvent,
  },
  paywall: {
    can: { watch: apiPaywallCanWatch },
    mark: { watch: apiPaywallMarkWatch },
  },
  telemetry: {
    log: apiTelemetryLog,
    logBatch: apiTelemetryLogBatch,
  },
};

exports.pwa = {
  boot: pwaBoot,
  quiz: { answer: pwaQuizAnswer },
  ai: { suggest: pwaAiSuggest },
  coaching: { recommend: pwaCoachingRecommend },
  me: {
    summary: pwaMeSummary,
    goals: pwaMeGoals,
  },
};

exports.dashboard = {
  admin: { metrics: dashboardAdminMetrics },
  user: {
    summary: dashboardUserSummary,
    analytics: dashboardUserAnalytics,
  },
};

exports.social = {
  worker: socialWorker,
};

exports.post = {
  suggestions: postSuggestions,
};

exports.manage = {
  social: { config: manageSocialConfig },
  secrets,
};

exports.test = {
  social: { connection: testSocialConnection },
};

exports.funnel = {
  send: { email: funnelSendEmail },
  process: { queue: funnelProcessQueue },
  campaign: {
    create: funnelCampaignCreate,
    list: funnelCampaignList,
  },
  subscribe: funnelSubscribe,
  unsubscribe: funnelUnsubscribe,
};

exports.content = {
  leaderboard: contentLeaderboard,
};

exports.seo = {
  watch: seoWatch,
};

exports.capture = {
  quiz: { lead: captureQuizLead },
};

exports.ai = {
  suggest: { topics: aiSuggestTopics },
};

exports.og = {
  render: {
    all: ogRenderAll,
    single: ogRenderSingle,
  },
};

// Simple top-level exports for functions without hyphens
exports.getPublicConfig = getConfig;

// ============================================================================
// DUAL EXPORTS: Add hyphenated bracket notation for 1st Gen Cloud Functions
// These exports allow 1st Gen runtime to find functions using their original
// hyphenated names while maintaining nested structure for 2nd Gen functions
// ============================================================================

// Admin crosspost functions
exports['admin-crosspost-list'] = adminCrosspostList;
exports['admin-crosspost-variants'] = adminCrosspostVariants;
exports['admin-crosspost-queue'] = adminCrosspostQueue;
exports['admin-crosspost-publish'] = adminCrosspostPublish;

// Admin check and version functions
exports['admin-check-role'] = adminCheckRole;
exports['admin-get-version'] = adminGetVersion;
exports['admin-bump-version'] = apiAdminBumpVersion;

// Admin CRM and referrals
exports['admin-crm'] = adminCrm;
exports['admin-referrals-overview'] = adminReferralsOverview;
exports['admin-referrals-settings'] = adminReferralsSettings;
exports['admin-referrals-create'] = adminReferralsCreate;

// API admin functions
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
exports['api-admin-crm'] = adminCrm;

// API admin leads functions (2nd Gen, but add for consistency)
exports['api-admin-leads-list'] = list;
exports['api-admin-leads-update'] = update;
exports['api-admin-leads-export'] = exportCsv;

// API admin calendar functions (2nd Gen, but add for consistency)
exports['api-admin-calendar-bookings'] = getCalendarBookings;
exports['api-admin-calendar-sync'] = syncCalendarBookings;
exports['api-admin-calendar-delete'] = deleteCalendarBooking;

// Config and secrets
exports['api-public-config'] = getConfig;
exports['api-manage-secrets'] = secrets;

// Lessons functions
exports['api-lessons-get'] = apiLessonsGet;
exports['api-lessons-continue'] = apiLessonsContinue;
exports['api-lessons-progress'] = apiLessonsProgress;
exports['api-lessons-event'] = apiLessonsEvent;

// Paywall functions (2nd Gen, but add for consistency)
exports['api-paywall-can-watch'] = apiPaywallCanWatch;
exports['api-paywall-mark-watch'] = apiPaywallMarkWatch;

// Telemetry functions (2nd Gen, but add for consistency)
exports['api-telemetry-log'] = apiTelemetryLog;
exports['api-telemetry-log-batch'] = apiTelemetryLogBatch;

// PWA functions
exports['pwa-boot'] = pwaBoot;
exports['pwa-quiz-answer'] = pwaQuizAnswer;
exports['pwa-ai-suggest'] = pwaAiSuggest;
exports['pwa-coaching-recommend'] = pwaCoachingRecommend;
exports['pwa-me-summary'] = pwaMeSummary;
exports['pwa-me-goals'] = pwaMeGoals;

// Dashboard functions
exports['dashboard-admin-metrics'] = dashboardAdminMetrics;
exports['dashboard-user-summary'] = dashboardUserSummary;
exports['dashboard-user-analytics'] = dashboardUserAnalytics;

// Social media functions
exports['social-worker'] = socialWorker;
exports['post-suggestions'] = postSuggestions;
exports['manage-social-config'] = manageSocialConfig;
exports['test-social-connection'] = testSocialConnection;

// Funnel/email functions
exports['funnel-send-email'] = funnelSendEmail;
exports['funnel-process-queue'] = funnelProcessQueue;
exports['funnel-campaign-create'] = funnelCampaignCreate;
exports['funnel-campaign-list'] = funnelCampaignList;
exports['funnel-subscribe'] = funnelSubscribe;
exports['funnel-unsubscribe'] = funnelUnsubscribe;

// Content and SEO functions
exports['content-leaderboard'] = contentLeaderboard;
exports['seo-watch'] = seoWatch;

// Capture functions
exports['capture-quiz-lead'] = captureQuizLead;

// AI functions
exports['ai-suggest-topics'] = aiSuggestTopics;

// OG image functions
exports['og-render-all'] = ogRenderAll;
exports['og-render-single'] = ogRenderSingle;
