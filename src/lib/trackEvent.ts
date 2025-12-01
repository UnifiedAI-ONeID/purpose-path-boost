/**
 * @file This file provides a unified event tracking system that abstracts away the underlying analytics providers.
 * It sends events to multiple systems (e.g., legacy analytics, new metrics tracker) simultaneously,
 * ensuring data consistency and providing a single point of entry for all event tracking.
 */

import { track as legacyTrack, EventName, EventProperties } from '@/analytics/events';
import { metricsTracker } from './metricsTracker';
import { logger } from './log';

// --- Core Tracking Function ---

/**
 * Tracks an event across all configured analytics platforms.
 * This function serves as the single source of truth for event tracking.
 *
 * @param {EventName} eventName - The name of the event to track. Must be a known `EventName`.
 * @param {EventProperties} [properties] - Optional key-value pairs providing context for the event.
 */
export function trackEvent(eventName: EventName, properties?: EventProperties): void {
  // 1. Track in legacy system (e.g., Umami/PostHog via the existing abstraction)
  try {
    legacyTrack(eventName, properties);
  } catch (error) {
    logger.error(`[Tracking] Legacy analytics failed for event "${eventName}"`, { error });
  }

  // 2. Track in the new, more detailed metrics system
  // The metricsTracker might be null in non-browser environments, so we use optional chaining.
  try {
    metricsTracker?.track(eventName, properties);
  } catch (error) {
    logger.error(`[Tracking] Metrics tracker failed for event "${eventName}"`, { error });
  }

  // 3. Log to console in development for easy debugging
  if (import.meta.env.DEV) {
    logger.debug(`[Tracking] Event: "${eventName}"`, { properties });
  }
}

// --- Convenience Emitter Object ---

/**
 * A structured object with methods for tracking common, predefined application events.
 * Using these methods ensures consistency in event names and property structures.
 */
export const tracking = {
  // Page Navigation
  pageView: () => trackEvent('page_view'),
  navClick: (destination: string) => trackEvent('nav_click', { destination }),

  // User Actions
  ctaClick: (button: string, location: string) => trackEvent('cta_click', { button, location }),
  
  // Booking Funnel
  bookingStarted: () => trackEvent('book_start'),
  bookingCompleted: () => trackEvent('book_complete'),

  // Quiz Funnel
  quizCompleted: (score: number) => trackEvent('quiz_complete', { score }),

  // Blog Engagement
  blogRead: (slug: string, category: string) => trackEvent('blog_read', { slug, category }),
  blogCategoryClicked: (category: string) => trackEvent('blog_category_click', { category }),

  // E-commerce / Payments
  paymentInitiated: (amount: number, currency: string) => trackEvent('payment_initiated', { amount, currency }),
  paymentSuccess: (amount: number, currency: string, orderId: string) => trackEvent('payment_success', { amount, currency, orderId }),
  paymentFailed: (error: string) => trackEvent('payment_failed', { error }),
};

// --- Re-export for Advanced Usage ---

/**
 * Re-exporting the raw metricsTracker for cases where more advanced, direct control is needed.
 * For most use cases, the `tracking` object should be preferred.
 */
export { metricsTracker };
