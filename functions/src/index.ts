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
    log: {
      single: apiTelemetryLog,
      batch: apiTelemetryLogBatch,
    },
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
