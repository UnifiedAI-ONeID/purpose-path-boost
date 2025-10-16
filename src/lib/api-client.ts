import { supabase } from '@/integrations/supabase/client';

/**
 * API Client for making calls to Edge Functions
 * Replaces direct fetch('/api/*') calls with Edge Function invocations
 */

type ApiResponse<T = any> = {
  ok: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
};

/**
 * Maps legacy /api routes to Edge Function names
 */
const ROUTE_MAP: Record<string, string> = {
  '/api/version': 'api-version',
  '/api/testimonials/list': 'api-testimonials-list',
  '/api/coaching/list': 'api-coaching-list',
  '/api/coaching/get': 'api-coaching-get',
  '/api/coaching/book-url': 'api-coaching-book-url',
  '/api/cal/book-url': 'api-cal-book-url',
  '/api/contact/submit': 'api-contact-submit',
  '/api/admin/check-role': 'api-admin-check-role',
  '/api/admin/coaching/list': 'api-admin-coaching-list',
  '/api/admin/coaching/save': 'api-admin-coaching-save',
  '/api/admin/coupons/list': 'api-admin-coupons-list',
  '/api/admin/coupons/save': 'api-admin-coupons-save',
  '/api/admin/bookings': 'api-admin-bookings',
  '/api/admin/seo/alerts': 'api-admin-seo-alerts',
  '/api/calendar/feed': 'api-admin-calendar-feed',
  '/api/lessons/for-user': 'api-lessons-for-user',
  '/api/lessons/progress': 'api-lessons-progress',
  '/api/lessons/event': 'api-lessons-event',
  '/api/telemetry/log': 'api-telemetry-log',
  '/api/referral/track': 'api-referral-track',
  '/api/coaching/price': 'api-coaching-price',
  '/api/coaching/availability': 'api-coaching-availability',
  '/api/coaching/price-with-discount': 'api-coaching-price-with-discount',
  '/api/express/price': 'api-express-price',
  '/api/admin/fx/rates': 'api-admin-fx-rates',
  '/api/admin/fx/update': 'api-admin-fx-update',
  '/api/admin/fx/inspect': 'api-admin-fx-inspect',
  '/api/admin/pricing/suggest': 'api-admin-pricing-suggest',
  '/api/admin/pricing/apply-suggestion': 'api-admin-pricing-apply-suggestion',
  '/api/admin/pricing/adopt-winner': 'api-admin-pricing-adopt-winner',
  '/api/admin/seo/resolve': 'api-admin-seo-resolve',
  '/api/admin/tickets/overrides': 'api-admin-tickets-overrides',
  '/api/events/get': 'api-events-get',
  '/api/events/price-preview': 'api-events-price-preview',
  '/api/express/create': 'api-express-create',
  '/api/express/webhook': 'api-express-webhook',
  '/api/paywall/can-watch': 'api-paywall-can-watch',
  '/api/paywall/mark-watch': 'api-paywall-mark-watch',
  '/api/events/tickets': 'api-events-tickets',
  '/api/events/coupon-preview': 'api-events-coupon-preview',
  '/api/nudge/pull': 'api-nudge-pull',
  '/api/quiz/answer': 'api-quiz-answer',
  '/api/badges/award': 'api-badges-award',
  '/api/admin/bump-version': 'api-admin-bump-version',
  '/api/ai/status': 'api-ai-status',
  '/api/nudge/mark': 'api-nudge-mark',
  '/api/events/ics': 'api-events-ics',
  '/api/ai/logs': 'api-ai-logs',
  '/api/admin/seo/sources': 'api-admin-seo-sources',
  '/api/pricing/assign': 'api-pricing-assign',
  '/api/lessons/continue': 'api-lessons-continue',
  '/api/lessons/get': 'api-lessons-get',
  '/api/coaching/checkout': 'api-coaching-checkout',
  '/api/coaching/recommend': 'api-coaching-recommend',
  '/api/coaching/redeem': 'api-coaching-redeem',
  '/api/events/register': 'api-events-register',
  '/api/events/offer-accept': 'api-events-offer-accept',
  '/api/me/summary': 'api-me-summary',
  '/api/churn/intent': 'api-churn-intent',
};

/**
 * Invoke an Edge Function with automatic route mapping
 */
export async function invokeApi<T = any>(
  route: string, 
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<ApiResponse<T>> {
  try {
    const functionName = ROUTE_MAP[route] || route.replace('/api/', 'api-');
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: options?.body,
      headers: options?.headers,
    });

    if (error) {
      console.error(`Edge Function ${functionName} error:`, error);
      return { ok: false, error: error.message };
    }

    return data || { ok: true };
  } catch (error: any) {
    console.error('API invocation error:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Legacy fetch wrapper that automatically uses Edge Functions
 * Provides backward compatibility during migration
 */
export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // Check if this is an /api route
  if (url.startsWith('/api/')) {
    const result = await invokeApi(url, {
      body: options?.body ? JSON.parse(options.body as string) : undefined,
      headers: options?.headers as Record<string, string>,
    });

    // Create a Response-like object for compatibility
    return new Response(JSON.stringify(result), {
      status: result.ok ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fall back to regular fetch for non-API routes
  return fetch(url, options);
}
