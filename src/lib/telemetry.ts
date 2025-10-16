export async function log(event: string, props: any = {}) {
  try {
    await fetch('/api/telemetry/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, props, ts: Date.now() }),
    });
  } catch (error) {
    // Silently fail
    console.error('Telemetry error:', error);
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
