import { functions } from '@/firebase/config';
import { httpsCallable } from 'firebase/functions';

const apiTelemetryLog = httpsCallable(functions, 'api-telemetry-log');

export async function log(event: string, payload: Record<string, unknown> = {}) {
  try {
    const device_id = localStorage.getItem('zg.device');
    if (!device_id) return;

    await apiTelemetryLog({
      event_name: event,
      properties: { ...payload, device_id, source: 'pwa' },
      session_id: sessionStorage.getItem('metrics_session_id') || null
    });
  } catch {
    // Silently fail
  }
}

// Convenience functions
export const telemetry = {
  viewHome: () => log('view_home', { source: 'pwa' }),
  clickBook: (slug: string) => log('click_book', { slug }),
  checkoutSuccess: (slug: string, value_cents: number, currency: string) =>
    log('checkout_success', { slug, value_cents, currency }),
  returnUser: () => log('return_user', { timestamp: Date.now() })
};
