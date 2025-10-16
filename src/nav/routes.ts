export type RouteKey = 'home'|'coaching'|'coachingDetail'|'resources'|'sessions'|'me'|'quiz'|'checkout'|'dashboard';

export const ROUTES: Record<RouteKey, string> = {
  home:           '/pwa/home',
  quiz:           '/pwa/quiz',
  coaching:       '/pwa/coaching',
  coachingDetail: '/coaching/[slug]',
  resources:      '/resources',
  sessions:       '/sessions',
  checkout:       '/checkout',
  dashboard:      '/pwa/dashboard',
  me:             '/me',
};

// Helper to build path with params
export function pathOf(routePattern: string, params: Record<string, string> = {}) {
  let out = routePattern;
  Object.entries(params).forEach(([k, v]) => out = out.replace(`[${k}]`, encodeURIComponent(v)));
  return out;
}
