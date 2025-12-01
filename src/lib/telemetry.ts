/**
 * @file This file provides a centralized and type-safe telemetry logging system.
 * It queues events and sends them to a Firebase Cloud Function for processing.
 */

import { functions } from '@/firebase/config';
import { httpsCallable } from 'firebase/functions';

// --- Type Definitions ---

/**
 * Defines the structure of the payload sent to the telemetry endpoint.
 */
interface TelemetryPayload {
  event: string;
  props: Record<string, any>;
  ts: number;
}

// --- Firebase Cloud Function Reference ---

/**
 * A reference to the `api-telemetry-log` Firebase Cloud Function.
 * Creating this reference once and reusing it is more efficient than creating it on each call.
 */
const apiTelemetryLog = httpsCallable<TelemetryPayload, void>(functions, 'api-telemetry-log');

// --- Core Logging Function ---

/**
 * Logs a telemetry event by sending it to the backend.
 * This function is designed as a "fire-and-forget" operation, meaning it won't block
 * the main thread or wait for a response from the server.
 *
 * @param {string} event - The name of the event being logged (e.g., 'page_view').
 * @param {Record<string, any>} [props={}] - A set of key-value pairs providing context for the event.
 */
async function log(event: string, props: Record<string, any> = {}): Promise<void> {
  const payload: TelemetryPayload = {
    event,
    props,
    ts: Date.now(),
  };

  try {
    // We don't need to `await` the result, but we should handle potential errors.
    apiTelemetryLog(payload).catch(error => {
      // Log errors only in development to avoid console noise in production.
      if (import.meta.env.DEV) {
        console.error(`[Telemetry] Failed to log event "${event}":`, error);
      }
    });
  } catch (error) {
    // This would catch errors in the setup of the callable function itself.
    if (import.meta.env.DEV) {
      console.error('[Telemetry] Callable function setup error:', error);
    }
  }
}

// --- Telemetry Event Emitters ---

/**
 * A structured object containing methods for logging specific, predefined telemetry events.
 * This promotes consistency and avoids typos in event names.
 */
export const telemetry = {
  /** Logs a page view event. */
  pageView: (route: string) => log('page_view', { route }),

  /** Logs a click on a call-to-action (CTA) element. */
  clickCTA: (label: string, href: string) => log('cta_click', { label, href }),

  /** Logs the start of a checkout process. */
  startCheckout: (planSlug: string) => log('checkout_start', { plan_slug: planSlug }),

  /** Logs the successful completion of a checkout process. */
  completeCheckout: (planSlug: string) => log('checkout_complete', { plan_slug: planSlug }),

  /** Logs the start of a lesson viewing. */
  watchLesson: (lessonSlug: string) => log('watch_lesson', { lesson_slug: lessonSlug }),

  /** Logs the completion of a lesson. */
  completeLesson: (lessonSlug: string) => log('complete_lesson', { lesson_slug: lessonSlug }),
};
