export async function log(event: string, payload: any = {}) {
  try {
    const device_id = localStorage.getItem('zg.device');
    if (!device_id) return;

    await fetch('/api/pwa-telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id, event, payload })
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
