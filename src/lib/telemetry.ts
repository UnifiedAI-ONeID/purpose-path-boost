
import { functions } from '@/firebase/config';
import { httpsCallable } from 'firebase/functions';

// Define callable (don't await here, create reference)
const apiTelemetryLog = httpsCallable(functions, 'api-telemetry-log');

export async function log(event: string, props: any = {}) {
  try {
    // Fire and forget
    apiTelemetryLog({
      event, 
      props, 
      ts: Date.now() 
    }).catch(err => {
        if (import.meta.env.DEV) console.error('Telemetry error:', err);
    });
  } catch (error) {
    // Silently fail
    console.error('Telemetry setup error:', error);
  }
}

export const telemetry = {
  pageView: (route: string) => log('page_view', { route }),
  clickCTA: (label: string, href: string) => log('cta_click', { label, href }),
  startCheckout: (plan_slug: string) => log('checkout_start', { plan_slug }),
  completeCheckout: (plan_slug: string) => log('checkout_complete', { plan_slug }),
  watchLesson: (lesson_slug: string) => log('watch_lesson', { lesson_slug }),
  completeLesson: (lesson_slug: string) => log('complete_lesson', { lesson_slug }),
};
