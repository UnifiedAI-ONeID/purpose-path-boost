export async function log(event: string, payload: any = {}) {
  try {
    const device_id = localStorage.getItem('zg.device');
    if (!device_id) return;

    const { supabase } = await import('@/db'; import { dbClient as supabase } from '@/db');
    await supabase.functions.invoke('pwa-telemetry', {
      body: { device_id, event, payload }
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
