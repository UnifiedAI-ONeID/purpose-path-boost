/**
 * Unified event tracking that works with both systems:
 * 1. Legacy analytics (Umami/PostHog) - for existing setup
 * 2. New metrics tracker - for detailed event analytics in admin dashboard
 */

import { track as legacyTrack, EventName, EventProperties } from '@/analytics/events';
import { metricsTracker } from './metricsTracker';

/**
 * Track an event across all analytics systems
 * @param eventName - Name of the event to track
 * @param properties - Optional properties/metadata for the event
 */
export function trackEvent(eventName: EventName, properties?: EventProperties) {
  // Track in legacy system (Umami/PostHog)
  legacyTrack(eventName, properties);
  
  // Track in new metrics system
  metricsTracker.track(eventName, properties);
}

/**
 * Convenience methods for common events
 */
export const tracking = {
  // Page views
  pageView: () => {
    trackEvent('page_view');
  },

  // CTA clicks
  ctaClick: (button: string, location: string) => {
    trackEvent('cta_click', { button, location });
  },

  // Booking funnel
  bookingStarted: () => {
    trackEvent('book_start');
  },

  bookingCompleted: () => {
    trackEvent('book_complete');
  },

  // Quiz
  quizCompleted: (score: number) => {
    trackEvent('quiz_complete', { score });
  },

  // Blog engagement
  blogRead: (slug: string, category: string) => {
    trackEvent('blog_read', { slug, category });
  },

  blogCategoryClicked: (category: string) => {
    trackEvent('blog_category_click', { category });
  },

  // Navigation
  navClick: (destination: string) => {
    trackEvent('nav_click', { destination });
  },

  // Payment
  paymentInitiated: (amount: number, currency: string) => {
    trackEvent('payment_initiated', { amount, currency });
  },

  paymentSuccess: (amount: number, currency: string, orderId: string) => {
    trackEvent('payment_success', { amount, currency, orderId });
  },

  paymentFailed: (error: string) => {
    trackEvent('payment_failed', { error });
  },
};

// Re-export metrics tracker for advanced usage
export { metricsTracker };
